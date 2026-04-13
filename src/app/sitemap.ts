import type { MetadataRoute } from 'next';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';
import Roadmap from '@/models/Roadmap';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://englishhub.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await dbConnect();

  const [articles, roadmaps] = await Promise.all([
    Article.find({ isPublished: true }).select('slug updatedAt').lean(),
    Roadmap.find({ isPublished: true }).select('slug updatedAt').lean(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/vi`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/en`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/vi/roadmaps`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/en/roadmaps`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/vi/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/en/community`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ];

  const articleRoutes: MetadataRoute.Sitemap = articles.flatMap((a) => [
    { url: `${BASE_URL}/vi/articles/${a.slug}`, lastModified: a.updatedAt, changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/en/articles/${a.slug}`, lastModified: a.updatedAt, changeFrequency: 'monthly' as const, priority: 0.8 },
  ]);

  const roadmapRoutes: MetadataRoute.Sitemap = roadmaps.flatMap((r) => [
    { url: `${BASE_URL}/vi/roadmaps/${r.slug}`, lastModified: r.updatedAt, changeFrequency: 'weekly' as const, priority: 0.85 },
    { url: `${BASE_URL}/en/roadmaps/${r.slug}`, lastModified: r.updatedAt, changeFrequency: 'weekly' as const, priority: 0.85 },
  ]);

  return [...staticRoutes, ...articleRoutes, ...roadmapRoutes];
}
