import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    // Lấy query parameters (tuỳ chọn: filter theo articleId)
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId');

    const query: any = { userId };
    if (articleId) query.articleId = articleId;

    const notes = await Note.find(query).sort({ updatedAt: -1 }).lean();
    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const body = await req.json();
    const { title, content, articleId, color, tags } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const note = await Note.create({
      userId,
      title,
      content,
      articleId,
      color: color || 'bg-card',
      tags: tags || [],
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
