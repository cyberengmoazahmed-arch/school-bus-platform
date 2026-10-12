import { cn, initials, avatarColor } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const dim = { width: size, height: size };
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} style={dim} className={cn("rounded-full object-cover", className)} />;
  }
  return (
    <span
      style={{ ...dim, backgroundColor: avatarColor(name) }}
      className={cn("inline-grid place-items-center rounded-full font-semibold text-white", className)}
    >
      <span style={{ fontSize: size * 0.4 }}>{initials(name)}</span>
    </span>
  );
}
