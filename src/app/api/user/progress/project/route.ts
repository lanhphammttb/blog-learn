import { z } from 'zod';
import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { requireUser, unauthorized, apiError, notFound, badRequest, ok, validationError, getErrorMessage, isValidObjectId } from '@/lib/api-helpers';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';
import { SubmitProjectUseCase } from '@/core/use-cases/SubmitProjectUseCase';
import { MongooseUserProgressRepository } from '@/infrastructure/database/MongooseUserProgressRepository';
import { GeminiGradeService } from '@/infrastructure/services/GeminiGradeService';

const SubmitSchema = z.object({
  roadmapId: z.string().min(1),
  bossId: z.string().min(1),
  content: z.string().min(1).max(10000),
  locale: z.enum(['vi', 'en']).default('vi'),
});

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`project-post:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  const user = await requireUser();
  if (!user) return unauthorized();

  try {
    const body = await request.json();
    const parsed = SubmitSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const { roadmapId, bossId, content, locale } = parsed.data;

    if (!isValidObjectId(roadmapId)) return badRequest('Invalid roadmapId');

    await dbConnect();

    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) return notFound('Roadmap');

    const parts = bossId.split('_phase_');
    const phaseIndex = parseInt(parts[1], 10);
    const phase = roadmap.phases[phaseIndex];

    if (!phase?.project?.requirements) {
      return badRequest('Project requirements not found for this phase');
    }

    const progressRepo = new MongooseUserProgressRepository();
    const gradeService = new GeminiGradeService();
    const submitProjectUseCase = new SubmitProjectUseCase(progressRepo, gradeService);

    const result = await submitProjectUseCase.execute({
      userId: user.id,
      roadmapId,
      bossId,
      content,
      requirements: phase.project.requirements,
      email: user.email ?? undefined,
      locale,
    });

    return ok(result);
  } catch (error) {
    console.error('[BOSS_API_ERROR]', error);
    return apiError(getErrorMessage(error));
  }
}
