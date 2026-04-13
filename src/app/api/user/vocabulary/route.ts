import { z } from 'zod';
import dbConnect from '@/lib/db';
import Vocabulary from '@/models/Vocabulary';
import {
  requireUser, unauthorized, apiError, created, ok, validationError, getErrorMessage, badRequest,
} from '@/lib/api-helpers';

const VocabSchema = z.object({
  word: z.string().min(1).max(100),
  definition: z.string().min(1),
  phonetic: z.string().optional(),
  audioUrl: z.string().url().optional().or(z.literal('')),
});

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const body = await req.json();
    const parsed = VocabSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const vocab = await Vocabulary.findOneAndUpdate(
      { userId: user.id, word: parsed.data.word.toLowerCase() },
      { $set: { definition: parsed.data.definition, phonetic: parsed.data.phonetic, audioUrl: parsed.data.audioUrl } },
      { returnDocument: 'after', upsert: true }
    );

    return created(vocab);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const vocabs = await Vocabulary.find({ userId: user.id }).sort({ createdAt: -1 }).lean();
    return ok(vocabs);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
