import { useState } from "react";
import Avatar from "./Avatar";
import type { Conversation, Persona } from "../types";

type Props = {
  conversations: Conversation[];
  personas: Persona[];
  personaId: string | null;
  onSelectPersona: (id: string) => void;
  onNewPersona: () => void;
};

export default function Sidebar(p: Props) {
  const [chatsOpen, setChatsOpen] = useState(true);

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      <div className="p-3 font-bold text-lg">Momono</div>

      <nav className="px-2 py-1 flex flex-col gap-0.5">
        <button className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800">
          <span className="text-lg">🔍</span>
          Discover
        </button>
        <button
          onClick={p.onNewPersona}
          className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          <span className="text-lg">➕</span>
          Create Character
        </button>
      </nav>

      <div className="border-t border-zinc-200 dark:border-zinc-700 my-2" />

      <div className="px-2 py-1 flex flex-col gap-0.5 flex-1 overflow-y-auto">
        <button
          onClick={() => setChatsOpen(!chatsOpen)}
          className="flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          <span className={`text-xs transition-transform ${chatsOpen ? "rotate-90" : ""}`}>
            ▶
          </span>
          Chats
        </button>

        {chatsOpen && (
          <div className="ml-2 flex flex-col gap-0.5">
            {p.personas.length === 0 && (
              <p className="text-xs text-zinc-400 px-2.5 py-2">
                Belum ada karakter
              </p>
            )}
            {p.personas.map((ps) => {
              const hasChats = p.conversations.some((c) => c.persona_id === ps.id);
              return (
                <button
                  key={ps.id}
                  onClick={() => p.onSelectPersona(ps.id)}
                  className={`flex items-center gap-2.5 w-full p-2 rounded-lg text-sm ${
                    p.personaId === ps.id
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Avatar name={ps.name} size={28} />
                  <span className="truncate">{ps.name}</span>
                  {!hasChats && (
                    <span className="ml-auto text-[10px] text-zinc-400">baru</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
