import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import PersonaModal from "./components/PersonaModal";
import Login from "./components/Login";
import type { Conversation, Message, Persona } from "./types";

const DEFAULT_PROMPT =
  "Kamu HARUS membalas dalam format roleplay. " +
  "Setiap respon WAJIB mengandung aksi dalam tanda bintang *seperti ini*. " +
  "Contoh yang BENAR: *dia berjalan mendekat dan duduk di sebelahmu* Hei, lagi ngapain? " +
  "Contoh yang SALAH: Hai, lagi ngapain? (ini tanpa aksi, JANGAN lakukan ini). " +
  "Gunakan *asterisk* untuk: aksi, gerakan tubuh, ekspresi wajah, perasaan, suara, deskripsi situasi. " +
  "Campurkan aksi dan dialog dalam satu paragraf secara natural. " +
  "Jangan pernah memulai respon tanpa aksi asterisk terlebih dahulu.";

export default function App() {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [dark, setDark] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      handleLogin(urlToken);
      window.history.replaceState({}, "", "/");
    }
  }, []);

  function authHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function getJSON(url: string, init?: RequestInit): Promise<any> {
    try {
      const r = await fetch(url, {
        ...init,
        headers: { ...authHeaders(), ...init?.headers },
      });
      if (r.status === 401) {
        setToken(null);
        localStorage.removeItem("token");
        return null;
      }
      if (!r.ok) return null;
      return await r.json();
    } catch {
      return null;
    }
  }

  async function loadConversations(pid?: string | null) {
    const target = pid !== undefined ? pid : personaId;
    const url = target ? `/api/conversations?persona_id=${target}` : "/api/conversations";
    const data = await getJSON(url);
    if (data) setConversations(data);
  }

  async function loadPersonas() {
    const data = await getJSON("/api/personas");
    if (data) setPersonas(data);
  }

  useEffect(() => {
    if (token) {
      loadConversations();
      loadPersonas();
    }
  }, [token]);

  async function handleSelectPersona(pid: string) {
    setPersonaId(pid);
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    const persona = personas.find((p) => p.id === pid);
    const data = await getJSON(`/api/conversations?persona_id=${pid}`);
    if (data && data.length > 0) {
      const latest = data[0];
      setConversationId(latest.id);
      const msgs = await getJSON(`/api/conversations/${latest.id}/messages`);
      if (msgs) {
        setMessages(
          msgs.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }
    } else if (persona?.greeting) {
      setMessages([{ role: "assistant", content: persona.greeting }]);
    }
    setConversations(data || []);
  }

  function handleBackToDefault() {
    setPersonaId(null);
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    loadConversations(null);
  }

  async function handleSelectConversation(id: string) {
    setConversationId(id);
    setShowHistory(false);
    const d = await getJSON(`/api/conversations/${id}/messages`);
    if (!d) return;
    setMessages(
      d.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    );
  }

  function handleNewChat() {
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
  }

  async function handleDeleteHistory(pid: string) {
    await getJSON(`/api/conversations/persona/${pid}`, { method: "DELETE" });
    setConversations([]);
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
  }

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const d = await getJSON("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat", persona_id: personaId }),
    });
    if (!d) return "";
    setConversationId(d.id);
    loadConversations();
    return d.id;
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const cid = await ensureConversation();
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);
    setBusy(true);
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        conversation_id: cid || null,
        message: text,
        persona_id: personaId,
        system_prompt: DEFAULT_PROMPT,
      }),
    });
    if (r.status === 401) {
      setToken(null);
      localStorage.removeItem("token");
      setBusy(false);
      return;
    }
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += dec.decode(value, { stream: true });
      setMessages((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "assistant", content: acc };
        return c;
      });
    }
    setBusy(false);
  }

  function handleLogin(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    fetch("/api/auth/logout", {
      method: "POST",
      headers: authHeaders(),
    }).finally(() => {
      localStorage.removeItem("token");
      setToken(null);
      setMessages([]);
      setConversations([]);
      setConversationId(null);
    });
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  const currentPersona = personaId
    ? personas.find((p) => p.id === personaId) ?? null
    : null;

  return (
    <div className={`${dark ? "dark" : ""} flex h-screen`}>
      <Sidebar
        conversations={conversations}
        personas={personas}
        personaId={personaId}
        onSelectPersona={handleSelectPersona}
        onNewPersona={() => setModalOpen(true)}
        onDeleteHistory={handleDeleteHistory}
      />
      <div className="flex-1 flex flex-col relative">
        {personaId && currentPersona ? (
          <>
            <div className="flex items-center p-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
              <button
                onClick={handleBackToDefault}
                className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                ←
              </button>
              <span className="font-semibold text-sm truncate">
                {currentPersona.name}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`rounded-lg px-3 py-1 text-sm ${
                  showHistory
                    ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                    : "bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                📜 History
              </button>
              <button
                className="rounded-lg px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800"
                onClick={() => setDark(!dark)}
              >
                {dark ? "☀️" : "🌙"}
              </button>
              <button
                className="rounded-lg px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                onClick={handleLogout}
              >
                Keluar
              </button>
            </div>

            {showHistory && (
              <div className="absolute top-[45px] right-0 w-72 h-[calc(100%-45px)] border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 z-10 flex flex-col">
                <div className="p-3 font-semibold text-sm border-b border-zinc-200 dark:border-zinc-700">
                  History Chat
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                  <button
                    onClick={handleNewChat}
                    className="w-full text-left p-2.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-dashed border-indigo-300 dark:border-indigo-700"
                  >
                    + Chat Baru
                  </button>
                  {conversations.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelectConversation(c.id)}
                      className={`block w-full text-left p-2.5 rounded-lg text-sm truncate ${
                        conversationId === c.id
                          ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                          : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
                      }`}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-end p-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
            <button
              className="rounded-lg px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800"
              onClick={() => setDark(!dark)}
            >
              {dark ? "☀️ Light" : "🌙 Dark"}
            </button>
            <button
              className="rounded-lg px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
              onClick={handleLogout}
            >
              Keluar
            </button>
          </div>
        )}

        <ChatArea
          persona={currentPersona}
          messages={messages}
          input={input}
          setInput={setInput}
          onSend={send}
          busy={busy}
        />
      </div>
      {modalOpen && (
        <PersonaModal
          persona={null}
          token={token}
          onClose={() => setModalOpen(false)}
          onSaved={loadPersonas}
        />
      )}
    </div>
  );
}
