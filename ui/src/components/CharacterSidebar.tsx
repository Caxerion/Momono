import { useEffect, useState } from "react";
import {
  User,
  MessageSquare,
  Share2,
  Plus,
  History,
  Eye,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from "lucide-react";
import type { Conversation, Persona, PersonaReactions } from "../types";

type Props = {
  persona: Persona;
  conversations: Conversation[];
  conversationId: string | null;
  visible: boolean;
  token: string | null;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onViewProfile: (p: Persona) => void;
};

export default function CharacterSidebar({
  persona,
  conversations,
  conversationId,
  visible,
  token,
  onNewChat,
  onSelectConversation,
  onViewProfile,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [reactions, setReactions] = useState<PersonaReactions>({
    likes: persona.likes ?? 0,
    dislikes: persona.dislikes ?? 0,
    my_reaction: null,
  });

  const categories = (persona.categories ?? "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const visibleCategories = showAllCategories ? categories : categories.slice(0, 3);
  const hasMore = categories.length > 3;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/personas/${persona.id}/reactions`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && data.likes !== undefined) {
          setReactions(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [persona.id, token]);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleReaction(value: "like" | "dislike") {
    setReactions((prev) => ({ ...prev, my_reaction: value }));
    try {
      const r = await fetch(`/api/personas/${persona.id}/reaction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ value }),
      });
      const data = await r.json();
      if (r.ok && data && data.likes !== undefined) {
        setReactions(data);
      }
    } catch {
      // revert on error
    }
  }

  return (
    <div
      className={`w-72 flex-shrink-0 border-l border-zinc-200 dark:border-zinc-800 transition-all duration-300 ease-in-out overflow-hidden ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ marginLeft: visible ? 0 : -288 }}
    >
      <div className="w-72 h-full flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-900">
        {/* Banner header — foto profil ditampilkan penuh sebagai banner, bukan avatar bulat */}
        <button
          onClick={() => onViewProfile(persona)}
          className="relative w-full h-52 shrink-0 overflow-hidden group"
        >
          {persona.avatar_url ? (
            <img
              src={persona.avatar_url}
              alt={persona.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-600 via-violet-700 to-fuchsia-800 flex items-center justify-center">
              <ImageIcon size={56} className="text-white/25" strokeWidth={1.5} />
            </div>
          )}
          {/* gradient overlay biar teks tetap terbaca di atas foto apa pun */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/0" />
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <h3 className="text-xl font-bold text-white truncate drop-shadow-sm">
              {persona.name}
            </h3>
            {persona.title && (
              <p className="text-sm text-white/80 truncate">{persona.title}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-white/70">
              {persona.created_by && (
                <span className="flex items-center gap-1 truncate">
                  <User size={12} />
                  <span className="truncate font-medium text-white/90">
                    @{persona.created_by}
                  </span>
                </span>
              )}
              <span className="flex items-center gap-1 shrink-0">
                <MessageSquare size={12} />
                {conversations.length} chat{conversations.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </button>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Categories
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visibleCategories.map((cat) => (
                <span
                  key={cat}
                  className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
                >
                  {cat}
                </span>
              ))}
            </div>
            {hasMore && (
              <button
                onClick={() => setShowAllCategories(!showAllCategories)}
                className="mt-2 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                {showAllCategories ? (
                  <>
                    See less <ChevronUp size={13} />
                  </>
                ) : (
                  <>
                    See more ({categories.length - visibleCategories.length} more){" "}
                    <ChevronDown size={13} />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Like / Dislike */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-3">
          <button
            onClick={() => handleReaction("like")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              reactions.my_reaction === "like"
                ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-green-50 dark:hover:bg-green-900/20"
            }`}
          >
            <ThumbsUp size={16} />
            {reactions.likes}
          </button>
          <button
            onClick={() => handleReaction("dislike")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              reactions.my_reaction === "dislike"
                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
          >
            <ThumbsDown size={16} />
            {reactions.dislikes}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onNewChat}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Plus size={16} />
              <span>New Chat</span>
            </button>
            <button
              onClick={handleShare}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
              <span>{copied ? "Copied!" : "Share"}</span>
            </button>
            <button
              onClick={() => onViewProfile(persona)}
              className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <Eye size={16} />
              <span>Profile</span>
            </button>
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <History size={13} />
            Chat History
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2 flex flex-col gap-0.5 sidebar-scroll">
            {conversations.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 px-2 py-4 text-center">
                No conversations yet
              </p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectConversation(c.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors ${
                    conversationId === c.id
                      ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}