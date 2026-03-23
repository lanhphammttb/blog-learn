import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';

export async function GET() {
  try {
    await dbConnect();
    const articles = await Article.find({}).sort({ createdAt: -1 });
    return NextResponse.json(articles);
  } catch (error: any) {
    console.error('API GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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
