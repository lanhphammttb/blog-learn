import { z } from 'zod';
import dbConnect from '@/lib/db';
import Highlight from '@/models/Highlight';
import {
  requireUser, unauthorized, apiError, created, ok, validationError, badRequest, getErrorMessage,
} from '@/lib/api-helpers';

const HighlightSchema = z.object({
  articleId: z.string().min(1),
  textSnippet: z.string().min(1),
  note: z.string().optional(),
  colorCode: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const body = await req.json();
    const parsed = HighlightSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const highlight = await Highlight.findOneAndUpdate(
      { userId: user.id, articleId: parsed.data.articleId, textSnippet: parsed.data.textSnippet },
      { $set: { note: parsed.data.note, colorCode: parsed.data.colorCode ?? 'yellow' } },
      { returnDocument: 'after', upsert: true }
    );

    return created(highlight);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const articleId = searchParams.get('articleId');
  if (!articleId) return badRequest('articleId is required');

  const user = await requireUser();
  if (!user) return ok([]); // Return empty for anonymous users

  try {
    await dbConnect();
    const highlights = await Highlight.find({ userId: user.id, articleId }).lean();
    return ok(highlights);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
