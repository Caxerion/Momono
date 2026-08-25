import { useState } from "react";

type Props = {
  onLogin: (token: string) => void;
};

export default function Login({ onLogin }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await r.json();

      if (!r.ok) {
        setError(data.detail || "Terjadi kesalahan");
        return;
      }

      if (mode === "register") {
        setMode("login");
        setError("");
        return;
      }

      onLogin(data.token);
    } catch {
      setError("Tidak bisa terhubung ke server");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <form
        onSubmit={handleSubmit}
        className="w-80 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6 shadow-lg"
      >
        <h1 className="text-xl font-bold text-center mb-1">Momono</h1>
        <p className="text-xs text-zinc-500 text-center mb-6">
          Multi-language AI Chatbot
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm px-3 py-2">
            {error}
          </div>
        )}

        <label className="block mb-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Username
          </span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </label>

        <label className="block mb-5">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            minLength={8}
            required
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 text-white py-2 font-medium text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading
            ? "Memproses..."
            : mode === "login"
            ? "Masuk"
            : "Daftar"}
        </button>

        <p className="text-xs text-center mt-4 text-zinc-500">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-indigo-600 hover:underline"
          >
            {mode === "login" ? "Daftar" : "Masuk"}
          </button>
        </p>
      </form>
    </div>
  );
}
