import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';

const ArticleCreateSchema = z.object({
  title: z.string().min(1),
  title_en: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  content: z.string().min(1),
  content_en: z.string().optional(),
  excerpt: z.string().optional(),
  excerpt_en: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  series: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  isPublished: z.boolean().optional(),
});

export async function GET(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`articles-get:${clientId}`, { limit: 60, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
      query.isPublished = true;
    }

    let queryBuilder = Article.find(query).sort({ createdAt: -1 });
    if (search) {
      queryBuilder = queryBuilder.select('title slug category difficulty');
    }
    const articles = await queryBuilder;
    return NextResponse.json(articles, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    });
  } catch (error: unknown) {
    console.error('API GET Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch articles';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`articles-post:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const parsed = ArticleCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
    }
    const article = await Article.create(parsed.data);
    return NextResponse.json(article, { status: 201 });
  } catch (error: unknown) {
    console.error('API POST Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create article';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
