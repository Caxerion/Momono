import { useMemo, useState } from "react";
import { Heart, MessageSquare, Search, ThumbsUp } from "lucide-react";
import Avatar from "./Avatar";
import type { Persona } from "../types";

type Props = {
  personas: Persona[];
  favorites: Set<string>;
  onChat: (id: string) => void;
  onToggleFavorite: (persona: Persona, favorite: boolean) => void;
  onViewUser?: (userId: number | string) => void;
};

export default function Discover({ personas, favorites, onChat, onToggleFavorite, onViewUser }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return personas;
    return personas.filter(
      (ps) =>
        ps.name.toLowerCase().includes(q) ||
        (ps.title ?? "").toLowerCase().includes(q) ||
        (ps.created_by ?? "").toLowerCase().includes(q)
    );
  }, [personas, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
      <header className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Discover</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Jelajahi karakter buatan komunitas
        </p>
        <div className="relative mt-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 pl-8 pr-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-shadow"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center mt-10">
            {search ? `No results for "${search}"` : "No characters yet"}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((ps) => {
              const fav = favorites.has(ps.id);
              const likes = ps.likes ?? 0;
              const dislikes = ps.dislikes ?? 0;
              const total = likes + dislikes;
              const likePct = total > 0 ? Math.round((likes / total) * 100) : 0;
              const cats = (ps.categories ?? "")
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
                .slice(0, 3);
              return (
                <button
                  key={ps.id}
                  onClick={() => onChat(ps.id)}
                  className="group relative text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-indigo-400/50 transition-colors p-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3 pr-6">
                    <Avatar name={ps.name} src={ps.avatar_url} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {ps.name}
                      </p>
                      {ps.created_by && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (ps.user_id) onViewUser?.(ps.user_id);
                          }}
                          className="text-xs text-indigo-500 dark:text-indigo-400 truncate hover:underline"
                        >
                          @{ps.created_by}
                        </button>
                      )}
                    </div>
                  </div>
                  {ps.title && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {ps.title}
                    </p>
                  )}
                  {cats.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {cats.map((cat) => (
                        <span
                          key={cat}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mt-auto">
                    <span className="flex items-center gap-1">
                      <ThumbsUp size={12} />
                      {likePct}%
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={12} />
                      Chat
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(ps, !fav);
                    }}
                    title={fav ? "Remove from saved" : "Save to saved"}
                    className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${
                      fav
                        ? "text-rose-500 bg-rose-500/10"
                        : "text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <Heart size={15} fill={fav ? "currentColor" : "none"} />
                  </button>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}