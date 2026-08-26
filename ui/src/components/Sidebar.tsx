import { useEffect, useRef, useState } from "react";
import Avatar from "./Avatar";
import type { Conversation, Persona } from "../types";

type Props = {
  conversations: Conversation[];
  personas: Persona[];
  personaId: string | null;
  userProfile: { username: string; email: string } | null;
  onSelectPersona: (id: string) => void;
  onNewPersona: () => void;
  onDeleteHistory: (personaId: string) => void;
};

export default function Sidebar(p: Props) {
  const [chatsOpen, setChatsOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-screen">
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

      {p.userProfile && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Avatar name={p.userProfile.username} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate">{p.userProfile.username}</p>
              <p className="text-xs text-zinc-500 truncate">{p.userProfile.email}</p>
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-zinc-200 dark:border-zinc-700 my-2" />

      <div className="px-3 pb-2">
        <input
          className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Cari karakter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

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
            {(() => {
              const filtered = p.personas.filter((ps) =>
                ps.name.toLowerCase().includes(search.toLowerCase())
              );
              if (filtered.length === 0) {
                return (
                  <p className="text-xs text-zinc-400 px-2.5 py-2">
                    {search ? "Tidak ditemukan" : "Belum ada karakter"}
                  </p>
                );
              }
              return filtered.map((ps) => {
                const hasChats = p.conversations.some((c) => c.persona_id === ps.id);
                return (
                  <div
                    key={ps.id}
                    className={`group flex items-center gap-2 rounded-lg text-sm ${
                      p.personaId === ps.id
                        ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <button
                      onClick={() => p.onSelectPersona(ps.id)}
                      className="flex items-center gap-2.5 flex-1 p-2 min-w-0"
                    >
                      <Avatar name={ps.name} size={28} />
                      <span className="truncate">{ps.name}</span>
                      {!hasChats && (
                        <span className="ml-auto text-[10px] text-zinc-400 shrink-0">baru</span>
                      )}
                    </button>
                    <div className="relative shrink-0" ref={menuOpen === ps.id ? menuRef : undefined}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === ps.id ? null : ps.id);
                        }}
                        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-400"
                      >
                        ⋮
                      </button>
                      {menuOpen === ps.id && (
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-20 py-1">
                          <button
                            onClick={() => {
                              p.onDeleteHistory(ps.id);
                              setMenuOpen(null);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            Hapus History
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </aside>
  );
}
