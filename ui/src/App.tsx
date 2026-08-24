import { useEffect, useRef, useState } from "react";

const PERSONA =
  "Kamu adalah karakter dalam roleplay yang dramatis dan emosional. " +
  "Balas dengan gaya naratif mendalam, ekspresif, dan penuh nuansa. " +
  "Gunakan dialog, deskripsi perasaan, dan tension yang kuat.";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string };

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const res = await fetch("/api/conversations");
    setConversations(await res.json());
  }

  useEffect(() => {
    loadConversations();
  }, []);

  async function ensureConversation(): Promise<string> {
    if (conversationId) return conversationId;
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const data = await res.json();
    setConversationId(data.id);
    loadConversations();
    return data.id;
  }

  async function selectConversation(id: string) {
    setConversationId(id);
    const res = await fetch(`/api/conversations/${id}/messages`);
    const data = await res.json();
    setMessages(
      data.map((m: { role: string; content: string }) => ({
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

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversation_id: cid,
        message: text,
        system_prompt: PERSONA,
      }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: acc };
        return copy;
      });
    }
    setBusy(false);
  }

  return (
    <div id="app">
      <aside id="sidebar">
        <button id="new-chat" onClick={() => ensureConversation()}>
          + Chat Baru
        </button>
        <ul id="conv-list">
          {conversations.map((c) => (
            <li key={c.id} onClick={() => selectConversation(c.id)}>
              {c.title}
            </li>
          ))}
        </ul>
      </aside>
      <main id="chat">
        <div id="messages">
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.content}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form
          id="form"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            id="input"
            rows={2}
            value={input}
            placeholder="Ketik pesan..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button type="submit" disabled={busy}>
            Kirim
          </button>
        </form>
      </main>
    </div>
  );
}
