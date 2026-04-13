import { z } from 'zod';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';
import {
  requireUser, unauthorized, apiError, created, ok, validationError, getErrorMessage,
} from '@/lib/api-helpers';

const NoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  articleId: z.string().optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const articleId = searchParams.get('articleId');

    const query: Record<string, unknown> = { userId: user.id };
    if (articleId) query.articleId = articleId;

    const notes = await Note.find(query).sort({ updatedAt: -1 }).lean();
    return ok(notes);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const body = await req.json();
    const parsed = NoteSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const note = await Note.create({
      userId: user.id,
      ...parsed.data,
      color: parsed.data.color ?? 'bg-card',
      tags: parsed.data.tags ?? [],
    });

    return created(note);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
