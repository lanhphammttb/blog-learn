import { z } from 'zod';
import dbConnect from '@/lib/db';
import Note from '@/models/Note';
import {
  requireUser, unauthorized, apiError, notFound, ok, validationError, getErrorMessage,
} from '@/lib/api-helpers';

const NoteUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
  color: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await dbConnect();
    const result = await Note.findOneAndDelete({ _id: id, userId: user.id });
    if (!result) return notFound('Note');
    return ok({ success: true });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await dbConnect();
    const body = await req.json();
    const parsed = NoteUpdateSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const result = await Note.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: parsed.data },
      { returnDocument: 'after' }
    );
    if (!result) return notFound('Note');
    return ok(result);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
