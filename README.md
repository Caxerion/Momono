# Momono

Chatbot AI untuk roleplay (RP). Dibangun dengan kombinasi:
- **Go** → launcher / initializer (jalankan dari CMD, buka browser)
- **Python (FastAPI)** → tubuh API: LLM, memory, streaming
- **TypeScript (Vite)** → interface desktop (dibuka di browser)
- **SQLite** → simpan percakapan & persona (file lokal, tanpa server)

## Struktur
```
Momono/
├── init/     # Go  → launcher
├── server/   # Python → FastAPI + SQLite
└── ui/       # TypeScript → frontend
```

## Setup
1. **Python deps**
   ```
   cd server
   pip install -r requirements.txt
   ```
2. **API key** (OpenRouter / Claude / Gemini)
   ```
   set MOMONO_API_KEY=sk-...
   ```
   Bisa juga ubah `server/config.py` untuk ganti provider/model.
3. **UI (opsional, untuk dev)**
   ```
   cd ui
   npm install
   npm run dev
   ```

## Menjalankan
Dari root, pakai Go launcher:
```
cd init
go run main.go
```
Atau build dulu:
```
go build -o momono.exe main.go
momono.exe
```
Launcher akan menjalankan server Python lalu membuka browser ke `http://127.0.0.1:8000`.

## Catatan
- Model default di `config.py`: `anthropic/claude-3.5-sonnet` via OpenRouter.
- Ubah `MOMONO_MODEL`, `MOMONO_PROVIDER`, `MOMONO_API_BASE` lewat env var bila perlu.
