import { z } from 'zod';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import Roadmap from '@/models/Roadmap';
import {
  requireAdmin, unauthorized, apiError, notFound, ok, validationError, badRequest, getErrorMessage,
} from '@/lib/api-helpers';
import { awardXp } from '@/lib/user-progress';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

const ReviewSchema = z.object({
  progressId: z.string().min(1),
  bossId: z.string().min(1),
  status: z.enum(['approved', 'rejected', 'pending']),
  feedback: z.string().optional(),
});

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  try {
    await dbConnect();

    const progressRecords = await UserProgress.find({
      'projectSubmissions.status': 'pending',
    }).lean();

    const enriched = await Promise.all(
      progressRecords.map(async (record) => {
        const roadmap = await Roadmap.findById(record.roadmapId).select('title').lean();
        const pendingOnes = record.projectSubmissions.filter((s) => s.status === 'pending');
        return pendingOnes.map((s) => ({
          ...s,
          userId: record.userId,
          userEmail: record.email,
          roadmapId: record.roadmapId,
          roadmapTitle: roadmap?.title ?? 'Unknown Roadmap',
          progressId: record._id,
        }));
      })
    );

    return ok(enriched.flat());
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return unauthorized();

  try {
    await dbConnect();
    const body = await request.json();
    const parsed = ReviewSchema.safeParse(body);
    if (!parsed.success) return validationError(parsed.error.flatten());

    const { progressId, bossId, status, feedback } = parsed.data;

    const progress = await UserProgress.findById(progressId);
    if (!progress) return notFound('Progress record');

    const idx = progress.projectSubmissions.findIndex((s) => s.bossId === bossId);
    if (idx === -1) return notFound('Submission');

    progress.projectSubmissions[idx].status = status;
    if (feedback) progress.projectSubmissions[idx].feedback = feedback;

    if (status === 'approved') {
      if (!progress.completedProjects.includes(bossId)) {
        progress.completedProjects.push(bossId);
      }
      // Award XP via the awardXp helper for consistent history tracking
      await awardXp(progress.userId, progress.roadmapId as mongoose.Types.ObjectId, 50);
    }

    await progress.save();

    // Send in-app notification to the learner
    const roadmap = await Roadmap.findById(progress.roadmapId).select('title slug').lean();
    await Notification.create({
      userId: progress.userId,
      title: status === 'approved' ? 'Boss Battle Approved! 🏆' : 'Boss Battle Feedback',
      message: status === 'approved'
        ? `Your submission for "${roadmap?.title ?? 'the roadmap'}" has been approved. +50 XP earned!`
        : `Your submission for "${roadmap?.title ?? 'the roadmap'}" needs revision. Check the feedback.`,
      type: 'boss_review',
      link: roadmap?.slug ? `/roadmaps/${roadmap.slug}` : undefined,
    });

    return ok({ success: true, message: `Submission ${status}` });
  } catch (error) {
    return apiError(getErrorMessage(error));
  }
}
