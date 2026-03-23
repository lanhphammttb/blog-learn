import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { auth } from '@/auth';

export async function GET() {
  try {
    await dbConnect();
    const roadmaps = await Roadmap.find({ isPublished: true }).sort({ createdAt: -1 });
    return NextResponse.json(roadmaps);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'admin') {
     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await request.json();
    const roadmap = await Roadmap.create(body);
    return NextResponse.json(roadmap, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
