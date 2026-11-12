import { getCollection, type CollectionEntry } from 'astro:content';

export type PostEntry = CollectionEntry<'posts'>;
export type WikiEntry = CollectionEntry<'wiki'>;

export async function getPosts() {
  return (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export async function getWiki() {
  return (await getCollection('wiki', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.date.valueOf() - a.data.date.valueOf(),
  );
}

export function tagCounts(entries: Array<PostEntry | WikiEntry>) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.data.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-CN'));
}

export function groupByCategory<T extends PostEntry | WikiEntry>(
  entries: T[],
  order: string[],
) {
  const groups = new Map<string, T[]>();
  for (const entry of entries) {
    const list = groups.get(entry.data.category) ?? [];
    list.push(entry);
    groups.set(entry.data.category, list);
  }
  return [...groups.entries()].sort((a, b) => {
    const ai = order.indexOf(a[0]);
    const bi = order.indexOf(b[0]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi) || b[1].length - a[1].length;
  });
}

export function adjacentEntries<T extends { data: { date: Date } }>(entries: T[], index: number) {
  const current = entries[index];
  const newer = index > 0 ? entries[index - 1] : undefined;
  const older = index < entries.length - 1 ? entries[index + 1] : undefined;
  return { current, newer, older };
}
