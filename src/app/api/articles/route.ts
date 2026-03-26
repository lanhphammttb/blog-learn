import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`articles-get:${clientId}`, { limit: 60, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let query: any = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
      query.isPublished = true;
    }

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .select(search ? 'title slug category difficulty' : undefined);
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`articles-post:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  try {
    await dbConnect();
    const body = await request.json();
    const article = await Article.create(body);
    return NextResponse.json(article, { status: 201 });
  } catch (error: any) {
    console.error('API POST Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create article' }, { status: 400 });
  }
}
