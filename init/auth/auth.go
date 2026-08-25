package auth

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

var db *sql.DB

const sessionDuration = 7 * 24 * time.Hour // 7 hari

func Init(path string) error {
	d, err := sql.Open("sqlite", path)
	if err != nil {
		return err
	}

	schema := `
	CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	username TEXT UNIQUE NOT NULL,
	password_hash TEXT NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS sessions (
	token TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id),
	expires_at DATETIME NOT NULL,
	created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := d.Exec(schema); err != nil {
		return err
	}

	db = d
	return nil
}

func CreateSession(userID int64) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	token := hex.EncodeToString(b)
	expires := time.Now().Add(sessionDuration)

	if _, err := db.Exec(
		"INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
		token, userID, expires.Format(time.RFC3339),
	); err != nil {
		return "", err
	}
	return token, nil
}

func ValidateSession(token string) (int64, error) {
	var userID int64
	var expiresAt string
	err := db.QueryRow(
		"SELECT user_id, expires_at FROM sessions WHERE token=?", token,
	).Scan(&userID, &expiresAt)
	if err == sql.ErrNoRows {
		return 0, fmt.Errorf("session tidak ditemukan")
	}
	if err != nil {
		return 0, err
	}
	exp, err := time.Parse(time.RFC3339, expiresAt)
	if err != nil {
		return 0, err
	}
	if time.Now().After(exp) {
		db.Exec("DELETE FROM sessions WHERE token=?", token)
		return 0, fmt.Errorf("session sudah expired")
	}
	return userID, nil
}

func DeleteSession(token string) error {
	_, err := db.Exec("DELETE FROM sessions WHERE token=?", token)
	return err
}
