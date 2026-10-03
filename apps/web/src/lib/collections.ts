export function upsertById<T extends { id: string }>(items: T[], item: T): T[] {
  return items.some(({ id }) => id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [...items, item];
}

export function removeById<T extends { id: string }>(items: T[], id: string): T[] {
  return items.filter((item) => item.id !== id);
}
