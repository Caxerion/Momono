import { useEffect, useRef } from "react";
import Avatar from "./Avatar";
import type { Message, Persona } from "../types";

type Props = {
  persona: Persona | null;
  messages: Message[];
  input: string;
  setInput: (s: string) => void;
  onSend: () => void;
  busy: boolean;
};

export default function ChatArea(p: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [p.messages]);

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
      <header className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <Avatar name={p.persona?.name ?? "Default"} size={36} />
        <span className="font-semibold">{p.persona?.name ?? "Default"}</span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {p.messages.length === 0 && (
          <div className="text-center text-zinc-400 mt-10 px-4">
            {p.persona?.greeting
              ? p.persona.greeting
              : "Mulai ngobrol dengan karaktermu..."}
          </div>
        )}
        {p.messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <Avatar
              name={m.role === "user" ? "You" : p.persona?.name ?? "AI"}
              emoji={m.role === "user" ? "🙂" : undefined}
              size={36}
            />
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          p.onSend();
        }}
      >
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
          Kirim
        </button>
      </form>
    </main>
  );
}
