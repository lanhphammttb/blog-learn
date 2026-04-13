import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import { awardXp } from '@/lib/user-progress';
import mongoose from 'mongoose';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`progress-get:${clientId}`, { limit: 30, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const roadmapId = searchParams.get('roadmapId');

  try {
    await dbConnect();
    const userId = session.user.id;

    if (roadmapId) {
      if (!mongoose.Types.ObjectId.isValid(roadmapId)) {
        return NextResponse.json({ error: 'Invalid roadmapId' }, { status: 400 });
      }
      const progress = await UserProgress.findOne({
        userId,
        roadmapId: new mongoose.Types.ObjectId(roadmapId),
      });
      return NextResponse.json(progress?.completedArticles || []);
    } else {
      const allProgress = await UserProgress.find({ userId });
      return NextResponse.json(allProgress);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`progress-post:${clientId}`, { limit: 30, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { articleId, roadmapId, completed } = await request.json();

  if (!roadmapId || !mongoose.Types.ObjectId.isValid(roadmapId)) {
    return NextResponse.json({ error: 'roadmapId is required and must be a valid ObjectId' }, { status: 400 });
  }
  if (!articleId || !mongoose.Types.ObjectId.isValid(articleId)) {
    return NextResponse.json({ error: 'articleId is required and must be a valid ObjectId' }, { status: 400 });
  }

  try {
    await dbConnect();
    const userId = session.user.id;
    const email = session.user.email;
    const resolvedRoadmapId = new mongoose.Types.ObjectId(roadmapId);

    const progressDoc = await UserProgress.findOne({
      $or: [
        { userId, roadmapId: resolvedRoadmapId },
        ...(email ? [{ email, roadmapId: resolvedRoadmapId }] : []),
      ],
    });

    const updateData = {
      userId,
      email: email ?? undefined,
      lastUpdated: new Date(),
    };

    if (completed) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (progressDoc) {
        const lastActiveDate = progressDoc.lastActive ? new Date(progressDoc.lastActive) : null;
        const lastActiveDay = lastActiveDate
          ? new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate())
          : null;

        let newStreak = progressDoc.streak || 0;

        if (!lastActiveDay) {
          newStreak = 1;
        } else {
          const diffDays = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
          // diffDays === 0: same day, keep streak
        }

        await UserProgress.findByIdAndUpdate(progressDoc._id, {
          ...updateData,
          $addToSet: { completedArticles: new mongoose.Types.ObjectId(articleId) },
          $set: { streak: newStreak, lastActive: now },
        });
        await awardXp(userId, resolvedRoadmapId, 20);
      } else {
        await UserProgress.create({
          ...updateData,
          roadmapId: resolvedRoadmapId,
          completedArticles: [new mongoose.Types.ObjectId(articleId)],
          streak: 1,
          lastActive: now,
        });
        await awardXp(userId, resolvedRoadmapId, 20);
      }
    } else {
      if (progressDoc) {
        await UserProgress.findByIdAndUpdate(progressDoc._id, {
          ...updateData,
          $pull: { completedArticles: new mongoose.Types.ObjectId(articleId) },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update progress';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
