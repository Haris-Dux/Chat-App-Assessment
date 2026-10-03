function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserAvatar({ name }: { name: string }) {
  return (
    <span
      title={name}
      className="grid size-8 place-items-center rounded-full bg-ink font-mono text-[11px] text-paper"
    >
      {initials(name)}
    </span>
  );
}
