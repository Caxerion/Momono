import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import CreateCharacter from "./components/CreateCharacter";
import CharacterProfile from "./components/CharacterProfile";
import Settings from "./components/Settings";
import Login from "./components/Login";
import type { Conversation, Message, Persona, UserProfile } from "./types";

const DEFAULT_PROMPT =
  "You MUST reply in roleplay format. " +
  "Every response MUST contain actions in asterisks *like this*. " +
  "CORRECT example: *he walks closer and sits beside you* Hey, what are you doing? " +
  "WRONG example: Hey, what are you doing? (no action, DO NOT do this). " +
  "Use *asterisks* for: actions, body movements, facial expressions, feelings, sounds, situation descriptions. " +
  "Mix actions and dialogue in one paragraph naturally. " +
  "Never start a response without an asterisk action first.";

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
  const [createCharacterOpen, setCreateCharacterOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [viewProfilePersona, setViewProfilePersona] = useState<Persona | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [regenView, setRegenView] = useState<Record<number, number>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  async function loadProfile() {
    const data = await getJSON("/api/auth/me");
    if (data) setUserProfile(data);
  }

  useEffect(() => {
    if (token) {
      loadProfile();
      loadConversations();
      loadPersonas();
    } else {
      setUserProfile(null);
    }
  }, [token]);

  async function handleSelectPersona(pid: string) {
    setPersonaId(pid);
    setConversationId(null);
    setMessages([]);
    setShowHistory(false);
    setCreateCharacterOpen(false);
    setEditingPersona(null);
    setViewProfilePersona(null);
    setSettingsOpen(false);
    const persona = personas.find((p) => p.id === pid);
    const data = await getJSON(`/api/conversations?persona_id=${pid}`);
    if (data && data.length > 0) {
      const latest = data[0];
      setConversationId(latest.id);
      const msgs = await getJSON(`/api/conversations/${latest.id}/messages`);
      if (msgs) {
        setMessages(
          msgs.map((m: { role: string; content: string; regenerate_index?: number }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            regenerate_index: m.regenerate_index ?? 0,
          }))
        );
        setRegenView({});
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
      d.map((m: { role: string; content: string; regenerate_index?: number }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        regenerate_index: m.regenerate_index ?? 0,
      }))
    );
    setRegenView({});
  }

  function handleNewChat() {
    setConversationId(null);
    setShowHistory(false);
    setRegenView({});
    const persona = personas.find((p) => p.id === personaId);
    if (persona?.greeting) {
      setMessages([{ role: "assistant", content: persona.greeting }]);
    } else {
      setMessages([]);
    }
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
    setRegenView({});
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

  async function regenerate() {
    if (busy || !conversationId) return;
    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") { lastUserIdx = i; break; }
    }
    if (lastUserIdx === -1) return;
    const lastUserMsg = messages[lastUserIdx];

    let maxIdx = 0;
    for (let i = lastUserIdx + 1; i < messages.length; i++) {
      if (messages[i].role !== "assistant") break;
      if ((messages[i].regenerate_index ?? 0) >= maxIdx) maxIdx = (messages[i].regenerate_index ?? 0) + 1;
    }
    if (maxIdx >= 25) return;
    const nextIdx = maxIdx;

    setBusy(true);
    setMessages((m) => [...m, { role: "assistant", content: "", regenerate_index: nextIdx }]);
    setRegenView((v) => ({ ...v, [lastUserIdx]: nextIdx }));

    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({
        conversation_id: conversationId,
        message: lastUserMsg.content,
        persona_id: personaId,
        system_prompt: DEFAULT_PROMPT,
        is_regenerate: true,
        regenerate_index: nextIdx,
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
        c[c.length - 1] = { role: "assistant", content: acc, regenerate_index: nextIdx };
        return c;
      });
    }
    setBusy(false);
  }

  function prevRegen(groupIdx: number) {
    setRegenView((v) => {
      const cur = v[groupIdx] ?? 0;
      return { ...v, [groupIdx]: Math.max(0, cur - 1) };
    });
  }

  function nextRegen(groupIdx: number, max: number) {
    setRegenView((v) => {
      const cur = v[groupIdx] ?? 0;
      return { ...v, [groupIdx]: Math.min(max, cur + 1) };
    });
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
    <div className={`${dark ? "dark" : ""} flex h-screen overflow-hidden`}>
      <Sidebar
        conversations={conversations}
        personas={personas}
        personaId={personaId}
        userProfile={userProfile}
        onSelectPersona={handleSelectPersona}
        onNewPersona={() => { setEditingPersona(null); setCreateCharacterOpen(true); }}
        onEditPersona={(p) => { setEditingPersona(p); setCreateCharacterOpen(true); }}
        onDeleteHistory={handleDeleteHistory}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <div className="flex-1 flex flex-col relative min-h-0">
        {createCharacterOpen ? (
          <CreateCharacter
            persona={editingPersona}
            token={token}
            onBack={() => { setCreateCharacterOpen(false); setEditingPersona(null); }}
            onSaved={loadPersonas}
          />
        ) : settingsOpen && userProfile ? (
          <Settings
            profile={userProfile}
            token={token}
            onBack={() => setSettingsOpen(false)}
            onSaved={(updated) => setUserProfile(updated)}
          />
        ) : viewProfilePersona ? (
          <CharacterProfile
            persona={viewProfilePersona}
            onBack={() => setViewProfilePersona(null)}
            onEdit={(p) => { setViewProfilePersona(null); setEditingPersona(p); setCreateCharacterOpen(true); }}
            onChat={(pid) => { setViewProfilePersona(null); handleSelectPersona(pid); }}
          />
        ) : personaId && currentPersona ? (
          <>
            <div className="flex items-center p-2 border-b border-zinc-200 dark:border-zinc-800 gap-2">
              <button
                onClick={handleBackToDefault}
                className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                ←
              </button>
              <button
                onClick={() => setViewProfilePersona(currentPersona)}
                className="font-semibold text-sm truncate hover:underline"
              >
                {currentPersona.name}
              </button>
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
                Logout
              </button>
            </div>

            {showHistory && (
              <div className="absolute top-[45px] right-0 w-72 h-[calc(100%-45px)] border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 z-10 flex flex-col">
                <div className="p-3 font-semibold text-sm border-b border-zinc-200 dark:border-zinc-700">
                  History
                </div>
                <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
                  <button
                    onClick={handleNewChat}
                    className="w-full text-left p-2.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-dashed border-indigo-300 dark:border-indigo-700"
                  >
                    + New Chat
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

            <ChatArea
              persona={currentPersona}
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={send}
              onRegenerate={regenerate}
              regenView={regenView}
              onPrevRegen={prevRegen}
              onNextRegen={nextRegen}
              busy={busy}
            />
          </>
        ) : (
          <>
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
                Logout
              </button>
            </div>
            <ChatArea
              persona={currentPersona}
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={send}
              onRegenerate={regenerate}
              regenView={regenView}
              onPrevRegen={prevRegen}
              onNextRegen={nextRegen}
              busy={busy}
            />
          </>
        )}
      </div>
    </div>
  );
}
