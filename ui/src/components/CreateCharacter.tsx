import { useState } from "react";
import type { Persona } from "../types";

type Props = {
  persona: Persona | null;
  token: string | null;
  onBack: () => void;
  onSaved: () => void;
};

export default function CreateCharacter({ persona, token, onBack, onSaved }: Props) {
  const [name, setName] = useState(persona?.name ?? "");
  const [title, setTitle] = useState(persona?.title ?? "");
  const [about, setAbout] = useState(persona?.about ?? "");
  const [greeting, setGreeting] = useState(persona?.greeting ?? "");
  const [personality, setPersonality] = useState(persona?.personality ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const body = JSON.stringify({ name, title, about, greeting, personality });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
    if (persona) {
      await fetch(`/api/personas/${persona.id}`, {
        method: "PUT",
        headers,
        body,
      });
    } else {
      await fetch("/api/personas", {
        method: "POST",
        headers,
        body,
      });
    }
    setBusy(false);
    onSaved();
    onBack();
  }

  async function remove() {
    if (!persona) return;
    await fetch(`/api/personas/${persona.id}`, {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    onSaved();
    onBack();
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
      <div className="flex items-center gap-3 p-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800"
        >
          ← Back
        </button>
        <span className="font-semibold text-sm">
          {persona ? "Edit Character" : "Create New Character"}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Character name..."
        />

        <label className="block text-sm font-medium mb-1">Title (short description)</label>
        <input
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. A shy girl who loves reading novels"
        />

        <label className="block text-sm font-medium mb-1">About (character description)</label>
        <textarea
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800 resize-y"
          rows={4}
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          placeholder="e.g. A shy high school girl who is caring. Loves reading novels. When embarrassed, her cheeks turn red and she speaks softly."
        />

        <label className="block text-sm font-medium mb-1">Greeting (opening message, optional)</label>
        <textarea
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800 resize-y"
          rows={3}
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder="*she waves her hand* Hey, you're here too?"
        />

        <label className="block text-sm font-medium mb-1">Character's Personality</label>
        <textarea
          className="w-full mb-2 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800 resize-y"
          rows={10}
          maxLength={10000}
          value={personality}
          onChange={(e) => setPersonality(e.target.value)}
          placeholder="Describe the character's personality in detail: traits, habits, speech style, values, motivations, fears, etc."
        />
        <p className="text-xs text-zinc-400 mb-6">{personality.length}/10000 characters</p>

        <div className="flex justify-between items-center pb-6">
          {persona ? (
            <button
              className="px-4 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800"
              onClick={remove}
            >
              Delete Character
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded-lg text-sm bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              onClick={onBack}
            >
              Cancel
            </button>
            <button
              className="px-5 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              disabled={busy || !name}
              onClick={save}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
