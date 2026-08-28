#Momono

Momono is a local AI chatbot application designed specifically for roleplay (RP). It is built using a lightweight, multi-language stack:

* **Go**: Launcher and initializer (starts the backend and automatically opens the browser).
* **Python (FastAPI)**: Core API engine handling the LLM logic, memory management, and response streaming.
* **TypeScript (Vite)**: Clean, desktop-friendly web interface.
* **SQLite**: Local database to securely store conversations and character personas without needing an external server.

## Repository Structure

Momono/
├── init/     # Go → Application launcher
├── server/   # Python → FastAPI backend + SQLite database
└── ui/       # TypeScript → Frontend interface

## Setup Instructions

### 1. Install Python Dependencies
Navigate to the server directory and install the required packages:
```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Your API Key
Set your API key (compatible with OpenRouter, Claude, or Gemini) as an environment variable:

**Windows (CMD):**
```cmd
set MOMONO_API_KEY=sk-...
```

**Linux / macOS / Git Bash:**
```bash
export MOMONO_API_KEY="sk-..."
```
*Note: You can also directly modify `server/config.py` to change your default provider or model.*

### 3. Frontend UI (Optional, for development)
If you want to modify or develop the interface:
```bash
cd ui
npm install
npm run dev
```

## Running the Application

From the root directory, use the Go launcher to start everything automatically:

```bash
cd init
go run main.go
```

Alternatively, you can build the executable file first:

```bash
go build -o momono.exe main.go
./momono.exe
```

The launcher will spin up the Python server and instantly open your default web browser to `http://127.0.0.1:8000`.

## Configuration Notes

* **Default Model**: Configured to use `anthropic/claude-3.5-sonnet` via OpenRouter inside `config.py`.
* **Custom Environment Variables**: You can easily override settings by defining `MOMONO_MODEL`, `MOMONO_PROVIDER`, or `MOMONO_API_BASE` in your environment.

## License

This project is licensed under the MIT License.