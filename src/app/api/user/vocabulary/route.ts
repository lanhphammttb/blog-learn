import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Vocabulary from '@/models/Vocabulary';
import { auth } from '@/auth';

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized. Please login to save flashcards.' }, { status: 401 });
    }
    
    // Auth provider handling
    const userId = (session.user as any).id || (session.user as any).providerId;
    if (!userId) return NextResponse.json({ error: 'User ID missing' }, { status: 400 });

    const body = await req.json();
    const { word, definition, phonetic, audioUrl } = body;

    if (!word || !definition) {
      return NextResponse.json({ error: 'Word and definition are required' }, { status: 400 });
    }

    await dbConnect();

    // Upsert to handle saving the same word again
    const vocab = await Vocabulary.findOneAndUpdate(
      { userId, word: word.toLowerCase() },
      { 
        $set: { 
          definition, 
          phonetic, 
          audioUrl
        } 
      },
      { returnDocument: 'after', upsert: true }
    );

    return NextResponse.json(vocab, { status: 201 });
  } catch (error: any) {
    console.error('Save vocab error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Word already saved' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save vocabulary' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id || (session.user as any).providerId;
    
    await dbConnect();
    const vocabs = await Vocabulary.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json(vocabs);
  } catch (error: any) {
    console.error('Get vocab error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
