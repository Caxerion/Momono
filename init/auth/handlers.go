package auth

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

type credentials struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds);
	err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	creds.Username = strings.TrimSpace(creds.Username)
	creds.Email = strings.TrimSpace(creds.Email)
	if creds.Username == "" || creds.Email == "" || len(creds.Password) < 8 {
		http.Error(w, "username and email are required, password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "failed to process password", http.StatusInternalServerError)
		return
	}

	if _, err := db.Exec(
		"INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
		creds.Username, creds.Email, string(hash),
	); err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			http.Error(w, "username already taken", http.StatusConflict)
			return
		}
		http.Error(w, "failed to save user", http.StatusInternalServerError)
		log.Println("register: failed to insert user:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "registration successful"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	creds.Username = strings.TrimSpace(creds.Username)
	creds.Email = strings.TrimSpace(creds.Email)
	if (creds.Username == "" && creds.Email == "") || creds.Password == "" {
		http.Error(w, "username/email and password are required", http.StatusBadRequest)
		return
	}

	var userID int64
	var hash string
	var err error
	if creds.Email != "" {
		err = db.QueryRow(
			"SELECT id, password_hash FROM users WHERE email=?", creds.Email,
		).Scan(&userID, &hash)
		if err == sql.ErrNoRows {
			err = db.QueryRow(
				"SELECT id, password_hash FROM users WHERE username=?", creds.Email,
			).Scan(&userID, &hash)
		}
	} else {
		err = db.QueryRow(
			"SELECT id, password_hash FROM users WHERE username=?", creds.Username,
		).Scan(&userID, &hash)
	}
	if err == sql.ErrNoRows {
		http.Error(w, "invalid username/email or password", http.StatusUnauthorized)
		return
	}
	if err != nil {
		http.Error(w, "failed to process login", http.StatusInternalServerError)
		log.Println("login: query error:", err)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(creds.Password)); err != nil {
		http.Error(w, "invalid username/email or password", http.StatusUnauthorized)
		return
	}

	token, err := CreateSession(userID)
	if err != nil {
		http.Error(w, "failed to create session", http.StatusInternalServerError)
		log.Println("login: create session error:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	token = strings.TrimPrefix(token, "Bearer ")
	if token == "" {
		http.Error(w, "token not found", http.StatusBadRequest)
		return
	}
	_ = DeleteSession(token)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "logout successful"})
}

func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	token = strings.TrimPrefix(token, "Bearer ")
	if token == "" {
		http.Error(w, "token not found", http.StatusUnauthorized)
		return
	}
	userID, err := ValidateSession(token)
	if err != nil {
		http.Error(w, "invalid session", http.StatusUnauthorized)
		return
	}
	var username, email, displayName, aboutMe string
	err = db.QueryRow("SELECT username, email, COALESCE(display_name,''), COALESCE(about_me,'') FROM users WHERE id=?", userID).Scan(&username, &email, &displayName, &aboutMe)
	if err != nil {
		http.Error(w, "user not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"username":     username,
		"email":        email,
		"display_name": displayName,
		"about_me":     aboutMe,
	})
}

func UpdateProfileHandler(w http.ResponseWriter, r *http.Request) {
	token := r.Header.Get("Authorization")
	token = strings.TrimPrefix(token, "Bearer ")
	if token == "" {
		http.Error(w, "token not found", http.StatusUnauthorized)
		return
	}
	userID, err := ValidateSession(token)
	if err != nil {
		http.Error(w, "invalid session", http.StatusUnauthorized)
		return
	}
	var body struct {
		Username    string `json:"username"`
		DisplayName string `json:"display_name"`
		AboutMe     string `json:"about_me"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	body.Username = strings.TrimSpace(body.Username)
	if body.Username == "" {
		http.Error(w, "username is required", http.StatusBadRequest)
		return
	}
	_, err = db.Exec(
		"UPDATE users SET username=?, display_name=?, about_me=? WHERE id=?",
		body.Username, body.DisplayName, body.AboutMe, userID,
	)
	if err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			http.Error(w, "username already taken", http.StatusConflict)
			return
		}
		http.Error(w, "failed to update profile", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
