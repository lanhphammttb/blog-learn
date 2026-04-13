import dbConnect from '@/lib/db';
import Highlight from '@/models/Highlight';
import { requireUser, unauthorized, apiError, notFound, ok, getErrorMessage } from '@/lib/api-helpers';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    await dbConnect();
    const result = await Highlight.findOneAndDelete({ _id: id, userId: user.id });
    if (!result) return notFound('Highlight');
    return ok({ success: true });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
