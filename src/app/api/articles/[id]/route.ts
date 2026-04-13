import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';

const ArticleUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  title_en: z.string().optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  content: z.string().min(1).optional(),
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await dbConnect();
    const article = await Article.findById(id);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(article);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const parsed = ArticleUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 422 });
    }
    const article = await Article.findByIdAndUpdate(id, parsed.data, { returnDocument: 'after' });
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json(article);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update article';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await auth();
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const article = await Article.findByIdAndDelete(id);
    if (!article) return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    return NextResponse.json({ message: 'Article deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
