type Props = { name: string; emoji?: string; size?: number; src?: string | null };

const COLORS = [
  "bg-rose-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-fuchsia-500",
];

function hash(s: string): number {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export default function Avatar({ name, emoji, size = 40, src }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  const color = COLORS[hash(name) % COLORS.length];
  return (
    <div
      className={`${color} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
      style={{ width: size, height: size }}
    >
      {emoji || name.slice(0, 1).toUpperCase()}
    </div>
  );
}
