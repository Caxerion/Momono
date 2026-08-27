import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import type { Message, Persona, UserProfile } from "../types";

function renderText(text: string) {
  if (!text) return null;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const html = escaped.replace(/\*([^*]+)\*/g, '<em class="italic opacity-80">$1</em>');
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

type Bubble =
  | { type: "user"; msg: Message }
  | { type: "assistant"; msg: Message }
  | { type: "group"; userMsg: Message; responses: Message[] };

function buildBubbles(messages: Message[]): Bubble[] {
  const bubbles: Bubble[] = [];
  let i = 0;
  while (i < messages.length) {
    const m = messages[i];
    if (m.role === "user") {
      const userMsg = m;
      const responses: Message[] = [];
      i++;
      while (i < messages.length && messages[i].role === "assistant") {
        responses.push(messages[i]);
        i++;
      }
      if (responses.length > 0) {
        bubbles.push({ type: "group", userMsg, responses });
      } else {
        bubbles.push({ type: "user", msg: userMsg });
      }
    } else {
      bubbles.push({ type: "assistant", msg: m });
      i++;
    }
  }
  return bubbles;
}

type Props = {
  persona: Persona | null;
  messages: Message[];
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  onRegenerate: () => void;
  regenView: Record<number, number>;
  onPrevRegen: (groupIdx: number) => void;
  onNextRegen: (groupIdx: number, max: number) => void;
  busy: boolean;
  userProfile?: UserProfile | null;
};

export default function ChatArea(p: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const [photoPreview, setPhotoPreview] = useState(false);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [p.messages]);

  const bubbles = buildBubbles(p.messages);
  const lastGroupIdx = bubbles.length - 1;
  const lastBubble = bubbles[lastGroupIdx];
  const isLastGroupComplete =
    lastBubble?.type === "group" &&
    lastBubble.responses.length > 0 &&
    lastBubble.responses[lastBubble.responses.length - 1].content !== "";

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950 min-h-0">
      <header className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <Avatar name={p.persona?.name ?? "Default"} size={36} src={p.persona?.avatar_url} />
        <span className="font-semibold">{p.persona?.name ?? "Default"}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {p.messages.length === 0 && (
            <div className="text-center text-zinc-400 mt-10 px-4">
              Mulai chatting with your character...
            </div>
          )}

          {p.persona && p.persona.greeting && (
            <div className="flex flex-col items-center gap-2 pt-4 pb-2">
              <button
                className="rounded-full"
                onClick={() => p.persona?.avatar_url && setPhotoPreview(true)}
              >
                <Avatar name={p.persona.name} size={64} src={p.persona.avatar_url} />
              </button>
              <span className="font-bold text-lg">{p.persona.name}</span>
              {p.persona.title && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{p.persona.title}</span>
              )}
              <span className="text-xs text-zinc-400">
                Created by @{p.persona.created_by || p.userProfile?.username || "Unknown"}
              </span>
            </div>
          )}

          {bubbles.map((b, bi) => {
            if (b.type === "user") {
              return (
                <div key={`u-${bi}`} className="flex gap-3 flex-row-reverse">
                  <Avatar name="You" emoji="🙂" size={36} />
                  <div className="max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap bg-indigo-600 text-white">
                    {renderText(b.msg.content)}
                  </div>
                </div>
              );
            }

            if (b.type === "assistant") {
              return (
                <div key={`a-${bi}`} className="flex gap-3">
                  <Avatar name={p.persona?.name ?? "AI"} size={36} src={p.persona?.avatar_url} />
                  <div className="max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap bg-zinc-100 dark:bg-zinc-800">
                    {renderText(b.msg.content)}
                  </div>
                </div>
              );
            }

            const total = b.responses.length;
            const viewing = p.regenView[bi] ?? (total - 1);
            const safeViewing = Math.min(viewing, total - 1);
            const current = b.responses[safeViewing];
            const isLast = bi === lastGroupIdx;
            const showRegenBar = isLast && !p.busy && total > 0 && current.content !== "";

            return (
              <div key={`g-${bi}`}>
                <div className="flex gap-3 flex-row-reverse">
                  <Avatar name="You" emoji="🙂" size={36} />
                  <div className="max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap bg-indigo-600 text-white">
                    {renderText(b.userMsg.content)}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Avatar name={p.persona?.name ?? "AI"} size={36} src={p.persona?.avatar_url} />
                  <div className="max-w-[85%] rounded-2xl px-4 py-2 whitespace-pre-wrap bg-zinc-100 dark:bg-zinc-800">
                    {current.content ? (
                      renderText(current.content)
                    ) : p.busy && isLast ? (
                      <LoadingDots />
                    ) : null}
                  </div>
                </div>

                {showRegenBar && (
                  <div className="flex items-center gap-1 mt-1 ml-12">
                    {total > 1 && (
                      <>
                        <button
                          onClick={() => p.onPrevRegen(bi)}
                          disabled={safeViewing === 0}
                          className="text-xs px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ‹
                        </button>
                        <span className="text-xs text-zinc-400 tabular-nums">
                          {safeViewing + 1}/{total}
                        </span>
                        <button
                          onClick={() => p.onNextRegen(bi, total - 1)}
                          disabled={safeViewing === total - 1}
                          className="text-xs px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          ›
                        </button>
                      </>
                    )}
                    <button
                      onClick={p.onRegenerate}
                      disabled={total >= 25}
                      className="text-xs px-2 py-0.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      🔄 {total}/25
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      <form
        className="p-3 border-t border-zinc-200 dark:border-zinc-800"
        onSubmit={(e) => {
          e.preventDefault();
          p.onSend();
        }}
      >
        <div className="max-w-3xl mx-auto flex gap-2">
          <textarea
            className="flex-1 resize-none rounded-xl border p-3 bg-zinc-100 dark:bg-zinc-800"
            rows={2}
            value={p.input}
            placeholder="Type Anything..."
            onChange={(e) => p.setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                p.onSend();
              }
            }}
          />
          <button
            className="px-5 rounded-xl bg-indigo-600 text-white font-medium disabled:opacity-50"
            disabled={p.busy}
          >
            Send
          </button>
        </div>
      </form>

      {photoPreview && p.persona?.avatar_url && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setPhotoPreview(false)}
        >
          <img
            src={p.persona.avatar_url}
            alt={p.persona.name}
            className="w-64 h-64 rounded-full object-cover shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-5">
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}