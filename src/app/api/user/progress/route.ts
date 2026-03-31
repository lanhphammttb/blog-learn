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
    if (roadmapId) {
      const progress = await UserProgress.findOne({
        userId: (session.user as any).id,
        roadmapId: new mongoose.Types.ObjectId(roadmapId),
      });
      return NextResponse.json(progress?.completedArticles || []);
    } else {
       // All progress
       const allProgress = await UserProgress.find({ userId: (session.user as any).id });
       return NextResponse.json(allProgress);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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

  try {
    await dbConnect();
    const userId = (session.user as any).id;
    const email = session.user.email;
    const resolvedRoadmapId = roadmapId 
      ? new mongoose.Types.ObjectId(roadmapId) 
      : new mongoose.Types.ObjectId('000000000000000000000000');
    
    console.log(`[DEBUG] API Progress: Updating for user: ${userId}, email: ${email}, roadmap: ${resolvedRoadmapId}, article: ${articleId}, completed: ${completed}`);
    
    // 1. Try to find an existing progress record for this specific user/roadmap
    // We check both current ID and verified Email
    let progressDoc = await UserProgress.findOne({
      $or: [
        { userId, roadmapId: resolvedRoadmapId },
        { email: email, roadmapId: resolvedRoadmapId }
      ].filter(f => f.userId || f.email)
    });

    const updateData: any = {
      userId,
      email: email || undefined,
      lastUpdated: new Date()
    };

    if (completed) {
      // XP & Streak Logic
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      if (progressDoc) {
        const lastActiveDate = progressDoc.lastActive ? new Date(progressDoc.lastActive) : null;
        const lastActiveDay = lastActiveDate ? new Date(lastActiveDate.getFullYear(), lastActiveDate.getMonth(), lastActiveDate.getDate()) : null;
        
        let newStreak = progressDoc.streak || 0;
        let newXP = (progressDoc.xp || 0) + 10; // +10 XP for article

        if (!lastActiveDay) {
          newStreak = 1;
        } else {
          const diffDays = Math.floor((today.getTime() - lastActiveDay.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            newStreak += 1; // Continuous streak
          } else if (diffDays > 1) {
            newStreak = 1; // Streak broken
          }
          // if diffDays === 0, keep streak
        }

        await UserProgress.findByIdAndUpdate(progressDoc._id, {
          ...updateData,
          $addToSet: { completedArticles: new mongoose.Types.ObjectId(articleId) },
          $set: { 
            streak: newStreak, 
            lastActive: now 
          }
        });
        await awardXp(userId, resolvedRoadmapId, 20); // Award XP and history
      } else {
        // Create new progress record
        await UserProgress.create({
          ...updateData,
          roadmapId: resolvedRoadmapId,
          completedArticles: [new mongoose.Types.ObjectId(articleId)],
          streak: 1,
          lastActive: now
        });
        await awardXp(userId, resolvedRoadmapId, 20); // Award XP and history
      }
    } else {
      if (progressDoc) {
        await UserProgress.findByIdAndUpdate(progressDoc._id, {
          ...updateData,
          $pull: { completedArticles: new mongoose.Types.ObjectId(articleId) },
          // No XP reduction for un-completing for now to avoid complexity
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
