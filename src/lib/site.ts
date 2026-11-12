export const SITE = {
  title: 'YHHD Notes',
  shortTitle: 'YHHD',
  description: '关于 AI Agent、后端系统与开发者工具的长期笔记。',
  author: 'Haohao Yin',
  handle: 'YHHD',
  url: 'https://yhhd.github.io',
  since: 2022,
  copyrightYear: 2026,
  github: 'https://github.com/YHHD',
  nav: [
    { href: '/llm-wiki/', label: 'LLM Wiki', badge: 'AI' },
    { href: '/posts/', label: '博客', badge: '' },
    { href: '/wiki/', label: '知识库', badge: '' },
    { href: '/about/', label: '关于', badge: '' },
  ],
};

export const CATEGORY_STYLES: Record<string, { color: string; soft: string }> = {
  'AI 工程': { color: 'var(--purple)', soft: 'var(--purple-soft)' },
  '系统设计': { color: 'var(--blue)', soft: 'var(--blue-soft)' },
  '开发工具': { color: 'var(--teal)', soft: 'var(--teal-soft)' },
  '工程实践': { color: 'var(--green)', soft: 'var(--green-soft)' },
  'AI 与 Agent': { color: 'var(--sky)', soft: 'var(--sky-soft)' },
  '项目与方案': { color: 'var(--pink)', soft: 'var(--pink-soft)' },
  '技术手册': { color: 'var(--teal)', soft: 'var(--teal-soft)' },
  '研究资料': { color: 'var(--orange)', soft: 'var(--orange-soft)' },
  '未分类': { color: 'var(--faint)', soft: 'var(--surface-soft)' },
};

export const POST_CATEGORY_ORDER = [
  'AI 工程',
  '系统设计',
  '开发工具',
  '工程实践',
];

export const WIKI_CATEGORY_ORDER = [
  'AI 与 Agent',
  '项目与方案',
  '技术手册',
  '研究资料',
];

export const CATEGORY_STICKER: Record<string, string> = {
  'AI 与 Agent': 'var(--sky)',
  '项目与方案': 'var(--pink)',
  '技术手册': 'var(--teal)',
  '研究资料': 'var(--orange)',
};

export function formatDate(date: Date, style: 'short' | 'long' = 'short') {
  const locale = 'zh-CN';
  if (style === 'long') {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replaceAll('/', '.');
}

export function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function wordCount(markdown: string) {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_~\-]/g, ' ');
  const chinese = (cleaned.match(/[\u3400-\u9fff]/g) || []).length;
  const latin = (cleaned.match(/[A-Za-z0-9]+/g) || []).length;
  return chinese + latin;
}

export function readingTime(markdown: string) {
  const cleaned = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ');
  const chinese = (cleaned.match(/[\u3400-\u9fff]/g) || []).length;
  const latin = (cleaned.match(/[A-Za-z0-9]+/g) || []).length;
  return Math.max(1, Math.ceil(chinese / 320 + latin / 220));
}

export function categoryStyle(category: string) {
  return CATEGORY_STYLES[category] ?? CATEGORY_STYLES['未分类'];
}

export function tagSlug(tag: string) {
  return tag
    .trim()
    .toLocaleLowerCase('zh-CN')
    .replace(/\s+/g, '-')
    .replace(/[^\p{Letter}\p{Number}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
