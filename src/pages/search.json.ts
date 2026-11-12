import type { APIRoute } from 'astro';
import { getPosts, getWiki } from '../lib/content';
import { isoDate, plainText } from '../lib/site';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const wiki = await getWiki();
  const items = [
    ...posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      href: `/posts/${post.id}/`,
      type: '文章' as const,
      tags: post.data.tags,
      date: isoDate(post.data.date),
      body: plainText(post.body ?? '').slice(0, 2400),
    })),
    ...wiki.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      href: `/wiki/${entry.id}/`,
      type: '知识库' as const,
      tags: entry.data.tags,
      date: isoDate(entry.data.date),
      body: plainText(entry.body ?? '').slice(0, 2400),
    })),
  ];

  return Response.json(items, {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  });
};
