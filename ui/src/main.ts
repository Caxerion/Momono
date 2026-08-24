import "./style.css";

const PERSONA = "Kamu adalah karakter RP yang imajinatif dan merespons dengan gaya naratif.";

let conversationId: string | null = null;

const messagesEl = document.getElementById("messages")!;
const inputEl = document.getElementById("input") as HTMLTextAreaElement;
const formEl = document.getElementById("form") as HTMLFormElement;
const convListEl = document.getElementById("conv-list") as HTMLUListElement;
const newChatBtn = document.getElementById("new-chat")!;

function addMessage(role: string, content: string): HTMLElement {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = content;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

async function loadConversations(): Promise<void> {
  const res = await fetch("/api/conversations");
  const data = await res.json();
  convListEl.innerHTML = "";
  for (const c of data) {
    const li = document.createElement("li");
    li.textContent = c.title;
    li.onclick = () => selectConversation(c.id, c.title);
    convListEl.appendChild(li);
  }
}

async function selectConversation(id: string, title: string): Promise<void> {
  conversationId = id;
  messagesEl.innerHTML = "";
  const res = await fetch(`/api/conversations/${id}/messages`);
  const data = await res.json();
  for (const m of data) addMessage(m.role, m.content);
}

async function newConversation(): Promise<void> {
  const res = await fetch("/api/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "New Chat" }),
  });
  const data = await res.json();
  conversationId = data.id;
  messagesEl.innerHTML = "";
  await loadConversations();
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = inputEl.value.trim();
  if (!text) return;
  inputEl.value = "";

  if (!conversationId) await newConversation();
  addMessage("user", text);
  const botEl = addMessage("assistant", "");

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversationId,
      message: text,
      system_prompt: PERSONA,
    }),
  });
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    botEl.textContent += decoder.decode(value, { stream: true });
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
});

newChatBtn.addEventListener("click", newConversation);
loadConversations();
