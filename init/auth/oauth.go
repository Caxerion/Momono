package auth

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
)

var githubOAuth = &oauth2.Config{
	Scopes:   []string{"read:user", "user:email"},
	Endpoint: github.Endpoint,
}

func InitGitHubOAuth() {
	githubOAuth.ClientID = os.Getenv("GITHUB_CLIENT_ID")
	githubOAuth.ClientSecret = os.Getenv("GITHUB_CLIENT_SECRET")
	githubOAuth.RedirectURL = "http://localhost:8000/api/auth/github/callback"
}

func GitHubLoginHandler(w http.ResponseWriter, r *http.Request) {
	url := githubOAuth.AuthCodeURL("state-token", oauth2.AccessTypeOnline)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func GitHubCallbackHandler(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "code tidak ditemukan", http.StatusBadRequest)
		return
	}

	token, err := githubOAuth.Exchange(r.Context(), code)
	if err != nil {
		http.Error(w, "gagal menukar code", http.StatusInternalServerError)
		log.Println("github oauth exchange error:", err)
		return
	}

	client := githubOAuth.Client(r.Context(), token)
	resp, err := client.Get("https://api.github.com/user")
	if err != nil {
		http.Error(w, "gagal mengambil data user", http.StatusInternalServerError)
		log.Println("github api error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var ghUser struct {
		ID    int    `json:"id"`
		Login string `json:"login"`
		Email string `json:"email"`
	}
	if err := json.Unmarshal(body, &ghUser); err != nil {
		http.Error(w, "gagal parse data user", http.StatusInternalServerError)
		return
	}

	githubID := strconv.Itoa(ghUser.ID)
	userID, err := FindUserByGithubID(githubID)
	if err != nil {
		userID, err = CreateUserWithGithub(githubID, ghUser.Login, ghUser.Email)
		if err != nil {
			http.Error(w, "gagal membuat user", http.StatusInternalServerError)
			log.Println("github: create user error:", err)
			return
		}
	}

	sessionToken, err := CreateSession(userID)
	if err != nil {
		http.Error(w, "gagal membuat session", http.StatusInternalServerError)
		log.Println("github: create session error:", err)
		return
	}

	http.Redirect(w, r,
		fmt.Sprintf("http://localhost:8000?token=%s", sessionToken),
		http.StatusTemporaryRedirect,
	)
}