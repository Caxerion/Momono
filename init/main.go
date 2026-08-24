package main

import (
	"fmt"
	"log"
	"os"
	"os/exec"
	"runtime"
	"time"
)

func main() {
	if _, err := exec.LookPath("python"); err != nil {
		if _, err := exec.LookPath("python3"); err != nil {
			log.Fatal("Python tidak ditemukan. Install Python 3.10+ dulu.")
		}
	}

	cmd := exec.Command("python", "-m", "uvicorn", "main:app",
		"--host", "127.0.0.1", "--port", "8000")
	cmd.Dir = "../server"
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Start(); err != nil {
		log.Fatalf("Gagal jalanin server: %v", err)
	}
	fmt.Println("Server starting di http://127.0.0.1:8000 ...")

	go func() {
		time.Sleep(2 * time.Second)
		openBrowser("http://127.0.0.1:8000")
	}()

	if err := cmd.Wait(); err != nil {
		log.Fatalf("Server berhenti: %v", err)
	}
}

func openBrowser(url string) {
	var err error
	switch runtime.GOOS {
	case "windows":
		err = exec.Command("cmd", "/c", "start", url).Start()
	case "darwin":
		err = exec.Command("open", url).Start()
	default:
		err = exec.Command("xdg-open", url).Start()
	}
	if err != nil {
		log.Printf("Buka browser manual: %s", url)
	}
}
