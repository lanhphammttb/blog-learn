import dbConnect from '@/lib/db';
import Vocabulary from '@/models/Vocabulary';
import { requireUser, unauthorized, apiError, notFound, ok, getErrorMessage } from '@/lib/api-helpers';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await dbConnect();
    const result = await Vocabulary.findOneAndDelete({ _id: id, userId: user.id });
    if (!result) return notFound('Vocabulary entry');
    return ok({ success: true });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
