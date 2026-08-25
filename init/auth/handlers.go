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
	Password string `json:"password"`
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds);
	err != nil {
		http.Error(w, "request tidak valid", http.StatusBadRequest)
		return
	}

	creds.Username = strings.TrimSpace(creds.Username)
	if creds.Username == "" || len(creds.Password) < 8 {
		http.Error(w, "username wajib diisi, password minimal 8 karakter", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(creds.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "gagal memproses password", http.StatusInternalServerError)
		return
	}

	if _, err := db.Exec(
		"INSERT INTO users (username, password_hash) VALUES (?, ?)",
		creds.Username, string(hash),
	); err != nil {
		if strings.Contains(err.Error(), "UNIQUE constraint failed") {
			http.Error(w, "username sudah dipakai", http.StatusConflict)
			return
		}
		http.Error(w, "gagal menyimpan user", http.StatusInternalServerError)
		log.Println("register: gagal insert user:", err)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "registrasi berhasil"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "request tidak valid", http.StatusBadRequest)
		return
	}

	creds.Username = strings.TrimSpace(creds.Username)
	if creds.Username == "" || creds.Password == "" {
		http.Error(w, "username dan password wajib diisi", http.StatusBadRequest)
		return
	}

	var userID int64
	var hash string
	err := db.QueryRow(
		"SELECT id, password_hash FROM users WHERE username=?", creds.Username,
	).Scan(&userID, &hash)
	if err == sql.ErrNoRows {
		http.Error(w, "username atau password salah", http.StatusUnauthorized)
		return
	}
	if err != nil {
		http.Error(w, "gagal memproses login", http.StatusInternalServerError)
		log.Println("login: query error:", err)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(creds.Password)); err != nil {
		http.Error(w, "username atau password salah", http.StatusUnauthorized)
		return
	}

	token, err := CreateSession(userID)
	if err != nil {
		http.Error(w, "gagal membuat session", http.StatusInternalServerError)
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
		http.Error(w, "token tidak ditemukan", http.StatusBadRequest)
		return
	}
	_ = DeleteSession(token)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "logout berhasil"})
}