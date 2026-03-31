import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Highlight from '@/models/Highlight';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id || (session.user as any).providerId;
    
    const body = await req.json();
    const { articleId, textSnippet, note, colorCode } = body;

    if (!articleId || !textSnippet) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();

    // If exact text matches for the same user + article, update the note. Otherwise create new.
    const highlight = await Highlight.findOneAndUpdate(
      { userId, articleId, textSnippet },
      { $set: { note, colorCode: colorCode || 'yellow' } },
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json(highlight, { status: 201 });
  } catch (error: any) {
    console.error('Highlight save error', error);
    return NextResponse.json({ error: 'Failed to save highlight' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId');
    
    if (!articleId) {
      return NextResponse.json({ error: 'articleId required' }, { status: 400 });
    }

    const session = await auth();
    if (!session?.user) {
       // Return empty array for anonymous users instead of error, so front-end doesn't crash
      return NextResponse.json([]);
    }
    
    const userId = (session.user as any).id || (session.user as any).providerId;

    await dbConnect();
    const highlights = await Highlight.find({ userId, articleId }).lean();
    
    return NextResponse.json(highlights);
  } catch (error: any) {
    console.error('Highlight GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
