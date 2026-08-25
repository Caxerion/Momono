import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import PersonaModal from "./components/PersonaModal";
import Login from "./components/Login";
import type { Conversation, Message, Persona } from "./types";

const DEFAULT_PROMPT =
  "Kamu adalah karakter dalam roleplay yang dramatis dan emosional. " +
  "Balas dengan gaya naratif mendalam, ekspresif, dan penuh nuansa.";

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
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

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

  async function loadConversations() {
    const data = await getJSON("/api/conversations");
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

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const d = await getJSON("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    if (!d) return "";
    setConversationId(d.id);
    loadConversations();
    return d.id;
  }

  async function selectConversation(id: string) {
    setConversationId(id);
    const d = await getJSON(`/api/conversations/${id}/messages`);
    if (!d) return;
    setMessages(
      d.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }))
    );
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
        search={search}
        onSearch={setSearch}
        onSelectConversation={selectConversation}
        onSelectPersona={setPersonaId}
        onNewChat={() => {
          setConversationId(null);
          setMessages([]);
        }}
        onNewPersona={() => setModalOpen(true)}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
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
