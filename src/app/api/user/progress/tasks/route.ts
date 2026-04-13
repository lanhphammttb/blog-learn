import { z } from 'zod';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import { requireUser, unauthorized, apiError, badRequest, ok, validationError, getErrorMessage, isValidObjectId, toObjectId } from '@/lib/api-helpers';

const TaskSchema = z.object({
  articleId: z.string().min(1),
  taskIndex: z.number().int().min(0),
  completed: z.boolean(),
  roadmapId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = TaskSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const { articleId, taskIndex, completed, roadmapId } = parsed.data;

    if (!isValidObjectId(roadmapId)) return badRequest('Invalid roadmapId');
    if (!isValidObjectId(articleId)) return badRequest('Invalid articleId');

    await dbConnect();

    const roadmapIdObj = toObjectId(roadmapId);
    const articleIdObj = toObjectId(articleId);

    let doc = await UserProgress.findOne({ userId: user.id, roadmapId: roadmapIdObj });

    if (!doc) {
      doc = await UserProgress.create({
        userId: user.id,
        email: user.email ?? undefined,
        roadmapId: roadmapIdObj,
        articleTasks: [],
        xp: 0,
        streak: 1,
        lastActive: new Date(),
      });
    }

    if (!doc.articleTasks) doc.articleTasks = [];

    let entry = doc.articleTasks.find((at) => at.articleId.toString() === articleId);

    if (!entry) {
      doc.articleTasks.push({ articleId: articleIdObj, taskIndices: [] } as never);
      entry = doc.articleTasks[doc.articleTasks.length - 1];
    }

    const idx = entry!.taskIndices.indexOf(taskIndex);

    if (completed) {
      if (idx === -1) {
        entry!.taskIndices.push(taskIndex);
        doc.xp = (doc.xp || 0) + 10;
      }
    } else {
      if (idx !== -1) {
        entry!.taskIndices.splice(idx, 1);
      }
    }

    doc.lastActive = new Date();
    doc.lastUpdated = new Date();
    doc.markModified('articleTasks');
    await doc.save();

    return ok({
      success: true,
      completedTasks: entry!.taskIndices,
      xp: doc.xp || 0,
      streak: doc.streak || 0,
    });
  } catch (error) {
    console.error('[TASKS_API_ERROR]', error);
    return apiError(getErrorMessage(error));
  }
}
