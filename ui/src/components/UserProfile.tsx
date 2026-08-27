import { useRef, useState } from "react";
import { ArrowLeft, Pencil, User } from "lucide-react";
import Avatar from "./Avatar";
import type { UserProfile } from "../types";

type Props = {
  profile: UserProfile;
  token: string | null;
  onBack: () => void;
  onSaved: (updated: UserProfile) => void;
};

export default function UserProfilePage({ profile, token, onBack, onSaved }: Props) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [aboutMe, setAboutMe] = useState(profile.about_me);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(file: File) {
    setUploading(true);
    const form = new FormData();
    form.append("avatar", file);
    const r = await fetch("/api/auth/avatar", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (r.ok) {
      const d = await r.json();
      setAvatarUrl(d.avatar_url);
    } else {
      const text = await r.text();
      setError(text || "Failed to upload avatar");
    }
    setUploading(false);
  }

  async function removeAvatar() {
    const r = await fetch("/api/auth/avatar", {
      method: "DELETE",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (r.ok) {
      setAvatarUrl("");
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    const r = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        username,
        display_name: displayName,
        about_me: aboutMe,
        avatar_url: avatarUrl,
      }),
    });
    if (r.ok) {
      setSaved(true);
      onSaved({ ...profile, username, display_name: displayName, about_me: aboutMe, avatar_url: avatarUrl });
      setEditing(false);
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
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali
        </button>
        <span className="font-semibold text-sm text-zinc-500 dark:text-zinc-400">Profile</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto w-full p-6 sm:p-8">
          {!editing ? (
            <>
              <div className="flex items-start gap-5">
                <Avatar name={profile.username} src={profile.avatar_url} size={112} />
                <div className="min-w-0 flex-1 pt-1">
                  <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white truncate">
                    {profile.display_name || profile.username}
                  </h1>
                  <p className="text-sm font-medium text-indigo-500 dark:text-indigo-400 mt-1">
                    @{profile.username}
                  </p>
                  {profile.email && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                      {profile.email}
                    </p>
                  )}
                </div>
              </div>

              {profile.about_me && (
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-2">
                    Tentang Saya
                  </p>
                  <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                      {profile.about_me}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setUsername(profile.username);
                  setDisplayName(profile.display_name);
                  setAboutMe(profile.about_me);
                  setAvatarUrl(profile.avatar_url ?? "");
                  setError("");
                  setEditing(true);
                }}
                className="flex items-center gap-2 mt-8 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6">
                Edit Profile
              </h2>

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <button
                    className="relative group rounded-full overflow-hidden"
                    onClick={() => !uploading && fileRef.current?.click()}
                  >
                    <Avatar name={profile.username} src={avatarUrl} size={96} />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {uploading ? (
                        <span className="text-white text-xs font-medium">Uploading...</span>
                      ) : (
                        <span className="text-white text-xs font-medium">Change</span>
                      )}
                    </div>
                  </button>
                  {avatarUrl && !uploading && (
                    <button
                      onClick={removeAvatar}
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                      title="Remove photo"
                    >
                      <User size={12} />
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAvatar(file);
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-zinc-400 mt-2">Click to change photo</p>
              </div>

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
                placeholder="Display name..."
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
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  disabled={busy || uploading || !username}
                  onClick={save}
                >
                  {uploading ? "Uploading..." : "Save"}
                </button>
                {saved && (
                  <span className="text-sm text-green-600 dark:text-green-400">Saved!</span>
                )}
                {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
