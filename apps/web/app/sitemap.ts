import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ibis.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/overview', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.9 },
    { path: '/signup', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/status', changeFrequency: 'hourly', priority: 0.7 },
    { path: '/filings', changeFrequency: 'daily', priority: 0.8 },
    { path: '/screener', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/peers', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/docs', changeFrequency: 'weekly', priority: 0.6 },
    { path: '/docs/api', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/docs/product', changeFrequency: 'weekly', priority: 0.6 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
