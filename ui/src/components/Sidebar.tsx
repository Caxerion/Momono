import Avatar from "./Avatar";
import type { Conversation, Persona } from "../types";

type Props = {
  conversations: Conversation[];
  personas: Persona[];
  personaId: string | null;
  search: string;
  onSearch: (s: string) => void;
  onSelectConversation: (id: string) => void;
  onSelectPersona: (id: string | null) => void;
  onNewChat: () => void;
  onNewPersona: () => void;
};

export default function Sidebar(p: Props) {
  const filtered = p.conversations.filter((c) =>
    c.title.toLowerCase().includes(p.search.toLowerCase())
  );

  return (
    <aside className="w-72 shrink-0 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      <div className="p-3 font-bold text-lg">Momono</div>

      <div className="px-3">
        <input
          className="w-full rounded-lg border p-2 text-sm bg-white dark:bg-zinc-800"
          placeholder="Cari chat..."
          value={p.search}
          onChange={(e) => p.onSearch(e.target.value)}
        />
      </div>

      <button
        className="m-3 rounded-lg bg-indigo-600 text-white py-2 font-medium"
        onClick={p.onNewChat}
      >
        + Chat Baru
      </button>

      <div className="px-3 text-xs uppercase text-zinc-500 font-semibold">
        Karakter
      </div>
      <div className="overflow-y-auto px-2 py-1 max-h-64">
        <button
          onClick={() => p.onSelectPersona(null)}
          className={`flex items-center gap-2 w-full p-2 rounded-lg ${
            p.personaId === null
              ? "bg-indigo-100 dark:bg-indigo-900"
              : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          <Avatar name="Default" emoji="💬" size={32} />
          <span className="text-sm">Default</span>
        </button>
        {p.personas.map((ps) => (
          <button
            key={ps.id}
            onClick={() => p.onSelectPersona(ps.id)}
            className={`flex items-center gap-2 w-full p-2 rounded-lg ${
              p.personaId === ps.id
                ? "bg-indigo-100 dark:bg-indigo-900"
                : "hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <Avatar name={ps.name} size={32} />
            <span className="text-sm truncate">{ps.name}</span>
          </button>
        ))}
        <button
          onClick={p.onNewPersona}
          className="flex items-center gap-2 w-full p-2 rounded-lg text-indigo-600 text-sm"
        >
          + Buat Karakter
        </button>
      </div>

      <div className="px-3 text-xs uppercase text-zinc-500 font-semibold mt-2">
        Percakapan
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => p.onSelectConversation(c.id)}
            className="block w-full text-left p-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm truncate"
          >
            {c.title}
          </button>
        ))}
      </div>
    </aside>
  );
}
