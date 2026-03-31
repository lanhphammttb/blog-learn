import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import Roadmap from '@/models/Roadmap';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';
import { gradeWithAI } from '@/lib/ai-grader';

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`project-post:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { roadmapId, bossId, content } = await request.json();

  if (!roadmapId || !bossId) {
    return NextResponse.json({ error: 'Missing roadmapId or bossId' }, { status: 400 });
  }

  try {
    await dbConnect();
    const userId = (session.user as any).id;
    const email = session.user.email;
    const now = new Date();

    // Tìm Requirements của Boss để AI chấm
    console.log('[BOSS_API] roadmapId:', roadmapId, 'bossId:', bossId);
    const roadmap = await Roadmap.findById(roadmapId);
    let aiStatus = 'pending';
    let aiFeedback = '';
    let xpGain = 0;

    if (roadmap) {
       console.log('[BOSS_API] Roadmap found:', roadmap.title);
       // Logic tìm phase index từ bossId (format: roadmapId_phase_index)
       const parts = bossId.split('_phase_');
       const phaseIndex = parseInt(parts[1]);
       const phase = roadmap.phases[phaseIndex];
       
       console.log('[BOSS_API] Phase index:', phaseIndex, 'Found phase:', !!phase);
       
       if (phase && phase.project?.requirements) {
          console.log('[BOSS_API] Starting AI Grading...');
          const aiResult = await gradeWithAI(phase.project.requirements, content);
          console.log('[BOSS_API] AI Result:', aiResult);
          aiStatus = aiResult.status;
          aiFeedback = `[AI Feedback]: ${aiResult.feedback}`;
          if (aiStatus === 'approved') xpGain = 50;
       } else {
          console.log('[BOSS_API] No requirements found for this phase.');
       }
    } else {
       console.log('[BOSS_API] Roadmap not found!');
    }

    // Cập nhật hoặc tạo mới Submission cùng kết quả AI
    const updateOps: any = {
      $set: { 
        email, 
        lastUpdated: now,
        lastActive: now
      },
      $pull: { projectSubmissions: { bossId } }
    };

    await UserProgress.findOneAndUpdate(
       { userId, roadmapId: new mongoose.Types.ObjectId(roadmapId) },
       updateOps,
       { upsert: true }
    );

    const finalResult = await UserProgress.findOneAndUpdate(
      { userId, roadmapId: new mongoose.Types.ObjectId(roadmapId) },
      { 
        $push: { 
          projectSubmissions: { 
            bossId, 
            content, 
            status: aiStatus, 
            submittedAt: now,
            feedback: aiFeedback
          } 
        },
        $inc: { xp: xpGain },
        ...(aiStatus === 'approved' ? { $addToSet: { completedProjects: bossId } } : {})
      },
      { upsert: true, returnDocument: 'after' }
    );

    return NextResponse.json({ 
      success: true, 
      projectSubmissions: finalResult.projectSubmissions,
      aiStatus,
      message: aiStatus === 'approved' ? 'AI đã phê duyệt bài nộp của bạn! +50 XP.' : 'Bài nộp đã được ghi nhận, đang chờ Admin xem xét.'
    });
  } catch (error: any) {
    console.error('[BOSS_API_ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
