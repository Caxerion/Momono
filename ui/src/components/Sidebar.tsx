import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Settings,
  Sparkles,
  Compass,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import Avatar from "./Avatar";
import type { Conversation, Persona, UserProfile } from "../types";

type Props = {
  conversations: Conversation[];
  personas: Persona[];
  personaId: string | null;
  userProfile: UserProfile | null;
  onSelectPersona: (id: string) => void;
  onNewPersona: () => void;
  onEditPersona: (persona: Persona) => void;
  onDeleteHistory: (personaId: string) => void;
  onOpenSettings: () => void;
};

export default function Sidebar(p: Props) {
  const [chatsOpen, setChatsOpen] = useState(true);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
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

  const filtered = p.personas.filter((ps) =>
    ps.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside
      className={`shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col h-screen relative transition-[width] duration-200 ease-in-out ${
        collapsed ? "w-16" : "w-72"
      }`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute -right-3 top-6 z-30 w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-sm flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
      >
        {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
      </button>

      {/* Brand */}
      <div
        className={`pt-4 pb-3 flex items-center gap-2 ${
          collapsed ? "justify-center px-0" : "px-4"
        }`}
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
            Momono.ai
          </span>
        )}
      </div>

      {/* Primary nav */}
      <nav className={`flex flex-col gap-0.5 ${collapsed ? "px-2 items-center" : "px-2"}`}>
        <button
          title="Discover"
          className={`flex items-center gap-3 rounded-lg text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors ${
            collapsed ? "justify-center w-10 h-10" : "w-full px-2.5 py-2"
          }`}
        >
          <Compass size={17} strokeWidth={2} />
          {!collapsed && "Discover"}
        </button>
        <button
          onClick={p.onNewPersona}
          title="Create Character"
          className={`flex items-center gap-3 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors ${
            collapsed ? "justify-center w-10 h-10" : "w-full px-2.5 py-2"
          }`}
        >
          <Plus size={17} strokeWidth={2.5} />
          {!collapsed && "Create Character"}
        </button>
      </nav>

      <div className="border-t border-zinc-200 dark:border-zinc-800 mt-3" />

      {/* Search (hidden when collapsed) */}
      {!collapsed && (
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
            />
            <input
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 pl-8 pr-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500 transition-shadow"
              placeholder="Search characters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Chat list */}
      <div
        className={`pb-1 flex flex-col gap-0.5 flex-1 overflow-y-auto sidebar-scroll ${
          collapsed ? "px-2 pt-3 items-center" : "px-2"
        }`}
      >
        {!collapsed && (
          <button
            onClick={() => setChatsOpen(!chatsOpen)}
            className="flex items-center gap-1.5 w-full px-2.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
          >
            <ChevronRight
              size={13}
              strokeWidth={2.5}
              className={`transition-transform duration-150 ${chatsOpen ? "rotate-90" : ""}`}
            />
            Chats
            {filtered.length > 0 && (
              <span className="ml-auto text-[11px] font-normal normal-case text-zinc-400">
                {filtered.length}
              </span>
            )}
          </button>
        )}

        {(collapsed || chatsOpen) && (
          <div className={`flex flex-col gap-0.5 ${collapsed ? "items-center" : ""}`}>
            {filtered.length === 0 ? (
              !collapsed && (
                <p className="text-xs text-zinc-400 px-3 py-3">
                  {search ? `No results for "${search}"` : "No characters yet"}
                </p>
              )
            ) : collapsed ? (
              // Collapsed: icon-only avatar rail
              filtered.map((ps) => {
                const isActive = p.personaId === ps.id;
                return (
                  <button
                    key={ps.id}
                    onClick={() => p.onSelectPersona(ps.id)}
                    title={ps.name}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-900/50"
                        : "hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-500" />
                    )}
                    <Avatar name={ps.name} size={28} src={ps.avatar_url} />
                  </button>
                );
              })
            ) : (
              filtered.map((ps) => {
                const hasChats = p.conversations.some((c) => c.persona_id === ps.id);
                const isActive = p.personaId === ps.id;
                return (
                  <div
                    key={ps.id}
                    className={`group relative flex items-center gap-1 rounded-lg text-sm transition-colors ${
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-900/50"
                        : "hover:bg-zinc-200/70 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-indigo-500" />
                    )}
                    <button
                      onClick={() => p.onSelectPersona(ps.id)}
                      className="flex items-center gap-2.5 flex-1 min-w-0 px-2.5 py-2"
                    >
                      <Avatar name={ps.name} size={30} src={ps.avatar_url} />
                      <div className="min-w-0 flex-1 text-left">
                        <span
                          className={`block truncate text-sm ${
                            isActive
                              ? "font-semibold text-indigo-700 dark:text-indigo-300"
                              : "text-zinc-700 dark:text-zinc-300"
                          }`}
                        >
                          {ps.name}
                        </span>
                        {ps.title && (
                          <span className="block truncate text-xs text-zinc-400">
                            {ps.title}
                          </span>
                        )}
                      </div>
                      {!hasChats && (
                        <span className="ml-auto shrink-0 text-[10px] font-medium text-indigo-500 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                          new
                        </span>
                      )}
                    </button>
                    <div
                      className="relative shrink-0 pr-1.5"
                      ref={menuOpen === ps.id ? menuRef : undefined}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(menuOpen === ps.id ? null : ps.id);
                        }}
                        className={`p-1.5 rounded-md text-zinc-400 hover:bg-zinc-300/70 dark:hover:bg-zinc-700 transition-opacity ${
                          menuOpen === ps.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <MoreVertical size={15} />
                      </button>
                      {menuOpen === ps.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                          <button
                            onClick={() => {
                              p.onEditPersona(ps);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          >
                            <Pencil size={14} />
                            Edit Character
                          </button>
                          <button
                            onClick={() => {
                              p.onDeleteHistory(ps.id);
                              setMenuOpen(null);
                            }}
                            className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 size={14} />
                            Delete History
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Footer / profile */}
      {p.userProfile && (
        <div
          className={`border-t border-zinc-200 dark:border-zinc-800 py-2 ${
            collapsed ? "px-2 flex justify-center" : "px-2"
          }`}
        >
          {collapsed ? (
            <button
              onClick={p.onOpenSettings}
              title={p.userProfile.display_name || p.userProfile.username}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors"
            >
              <Avatar name={p.userProfile.username} size={32} src={p.userProfile.avatar_url} />
            </button>
          ) : (
            <div className="flex items-center gap-1 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (p.userProfile?.avatar_url) setPhotoPreview(p.userProfile.avatar_url);
                }}
                className="shrink-0 pl-2"
              >
                <Avatar name={p.userProfile.username} size={36} src={p.userProfile.avatar_url} />
              </button>
              <button onClick={p.onOpenSettings} className="min-w-0 flex-1 text-left px-2 py-2">
                <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">
                  {p.userProfile.display_name || p.userProfile.username}
                </p>
                <p className="text-xs text-zinc-500 truncate">@{p.userProfile.username}</p>
              </button>
              <button
                onClick={p.onOpenSettings}
                className="shrink-0 p-2 mr-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <Settings size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Avatar preview modal */}
      {photoPreview && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center cursor-pointer"
          onClick={() => setPhotoPreview(null)}
        >
          <img
            src={photoPreview}
            alt="Profile"
            className="max-w-[80vw] max-h-[80vh] rounded-2xl object-contain shadow-2xl"
          />
        </div>
      )}

      <style>{`
        .sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.4); border-radius: 9999px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.6); }
      `}</style>
    </aside>
  );
}