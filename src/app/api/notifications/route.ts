import { z } from 'zod';
import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import {
  requireUser, unauthorized, apiError, ok, validationError, getErrorMessage,
} from '@/lib/api-helpers';

const MarkReadSchema = z.object({
  notificationId: z.string().optional(),
  all: z.boolean().optional(),
});

export async function GET() {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const notifications = await Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    return ok(notifications);
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    await dbConnect();
    const body = await request.json();
    const parsed = MarkReadSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    if (parsed.data.all) {
      await Notification.updateMany({ userId: user.id, isRead: false }, { isRead: true });
    } else if (parsed.data.notificationId) {
      await Notification.updateOne(
        { _id: parsed.data.notificationId, userId: user.id },
        { isRead: true }
      );
    }

    return ok({ success: true });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
