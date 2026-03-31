import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    await dbConnect();

    const result = await Note.findOneAndDelete({ _id: id, userId });
    
    if (!result) return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = (session.user as any).id;
    await dbConnect();

    const updates = await req.json();
    const result = await Note.findOneAndUpdate(
      { _id: id, userId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) return NextResponse.json({ error: 'Note not found or unauthorized' }, { status: 404 });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
