import Avatar from "./Avatar";
import type { Persona } from "../types";

type Props = {
  persona: Persona;
  onBack: () => void;
  onEdit: (persona: Persona) => void;
  onChat: (personaId: string) => void;
};

export default function CharacterProfile({ persona, onBack, onEdit, onChat }: Props) {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          ← Kembali
        </button>
        <span className="font-semibold text-sm">Profil Karakter</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <div className="flex flex-col items-center mb-8">
          <Avatar name={persona.name} size={96} />
          <h1 className="mt-4 text-2xl font-bold">{persona.name}</h1>
          {persona.title && (
            <p className="text-sm text-zinc-500 mt-1">{persona.title}</p>
          )}
        </div>

        {persona.about && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2 text-zinc-500 uppercase tracking-wide">About</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{persona.about}</p>
          </div>
        )}

        {persona.personality && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2 text-zinc-500 uppercase tracking-wide">Personality</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{persona.personality}</p>
          </div>
        )}

        {persona.greeting && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold mb-2 text-zinc-500 uppercase tracking-wide">Greeting</h2>
            <p className="text-sm whitespace-pre-wrap leading-relaxed italic opacity-80">{persona.greeting}</p>
          </div>
        )}

        {!persona.about && !persona.personality && !persona.greeting && (
          <p className="text-center text-zinc-400 text-sm">Belum ada deskripsi untuk karakter ini.</p>
        )}

        <div className="flex justify-center gap-3 mt-8 pb-6">
          <button
            onClick={() => onEdit(persona)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
          >
            Edit Karakter
          </button>
          <button
            onClick={() => onChat(persona.id)}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}
