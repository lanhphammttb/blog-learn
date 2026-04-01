import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import Roadmap from '@/models/Roadmap';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';

// Clean Architecture Imports
import { SubmitProjectUseCase } from '@/core/use-cases/SubmitProjectUseCase';
import { MongooseUserProgressRepository } from '@/infrastructure/database/MongooseUserProgressRepository';
import { GeminiGradeService } from '@/infrastructure/services/GeminiGradeService';

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`project-post:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roadmapId, bossId, content, locale = 'vi' } = await request.json();

  if (!roadmapId || !bossId) {
    return NextResponse.json({ error: 'Missing roadmapId or bossId' }, { status: 400 });
  }

  try {
    await dbConnect();
    const userId = (session.user as any).id;
    const email = session.user.email;

    // Initialize Clean Architecture dependencies
    const progressRepo = new MongooseUserProgressRepository();
    const gradeService = new GeminiGradeService();
    const submitProjectUseCase = new SubmitProjectUseCase(progressRepo, gradeService);

    // Find requirements from Roadmap model (Framework layer)
    const roadmap = await Roadmap.findById(roadmapId);
    if (!roadmap) {
      return NextResponse.json({ error: 'Roadmap not found' }, { status: 404 });
    }

    const parts = bossId.split('_phase_');
    const phaseIndex = parseInt(parts[1]);
    const phase = roadmap.phases[phaseIndex];
    
    if (!phase || !phase.project?.requirements) {
      return NextResponse.json({ error: 'Project requirements not found' }, { status: 400 });
    }

    // Execute Use Case
    const result = await submitProjectUseCase.execute({
      userId,
      roadmapId,
      bossId,
      content,
      requirements: phase.project.requirements,
      email: email || undefined,
      locale
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[BOSS_API_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
