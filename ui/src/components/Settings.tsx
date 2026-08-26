import { useState } from "react";
import type { UserProfile } from "../types";

type Props = {
  profile: UserProfile;
  token: string | null;
  onBack: () => void;
  onSaved: (updated: UserProfile) => void;
};

export default function Settings({ profile, token, onBack, onSaved }: Props) {
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [aboutMe, setAboutMe] = useState(profile.about_me);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ username, display_name: displayName, about_me: aboutMe }),
    });
    if (r.ok) {
      setSaved(true);
      onSaved({ ...profile, username, display_name: displayName, about_me: aboutMe });
      setTimeout(() => setSaved(false), 2000);
    } else {
      const text = await r.text();
          setError(text || "Failed to save");
    }
    setBusy(false);
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
        <span className="font-semibold text-sm">Profile Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full">
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username..."
        />

        <label className="block text-sm font-medium mb-1">Display Name</label>
        <input
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name you want to show..."
        />

        <label className="block text-sm font-medium mb-1">About Me</label>
        <textarea
          className="w-full mb-4 rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-zinc-100 dark:bg-zinc-800 resize-y"
          rows={6}
          value={aboutMe}
          onChange={(e) => setAboutMe(e.target.value)}
          placeholder="Tell about yourself..."
        />

        <div className="flex items-center gap-3 pb-6">
          <button
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600"
            onClick={onBack}
          >
            Cancel
          </button>
          <button
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            disabled={busy || !username}
            onClick={save}
          >
            Save
          </button>
          {saved && (
            <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
          )}
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}
