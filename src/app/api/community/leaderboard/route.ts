import dbConnect from '@/lib/db';
import UserProgress from '@/models/UserProgress';
import mongoose from 'mongoose';
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';
import { ok, apiError, getErrorMessage } from '@/lib/api-helpers';

export async function GET(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`leaderboard:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  try {
    await dbConnect();

    const leaderboard = await UserProgress.aggregate([
      {
        $project: {
          userId: 1,
          lessonCount: { $size: { $ifNull: ['$completedArticles', []] } },
          xp: { $ifNull: ['$xp', 0] },
        },
      },
      {
        $group: {
          _id: '$userId',
          totalLessons: { $sum: '$lessonCount' },
          totalRoadmaps: { $count: {} },
          totalXP: { $sum: '$xp' },
        },
      },
      { $sort: { totalXP: -1 } },
      { $limit: 20 },
    ]);

    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    const detailed = await Promise.all(
      leaderboard.map(async (entry) => {
        let user = null;
        if (usersCollection) {
          try {
            const orClauses: Record<string, unknown>[] = [{ email: entry._id }];
            if (mongoose.Types.ObjectId.isValid(entry._id)) {
              orClauses.push({ _id: new mongoose.Types.ObjectId(entry._id) });
            }
            user = await usersCollection.findOne({ $or: orClauses });
          } catch {
            // user lookup failed, use defaults
          }
        }

        return {
          id: entry._id.toString(),
          name: user?.name ?? 'Anonymous Learner',
          image: user?.image ?? null,
          totalLessons: entry.totalLessons,
          totalRoadmaps: entry.totalRoadmaps,
          totalXP: entry.totalXP,
        };
      })
    );

    return ok(detailed);
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return apiError(getErrorMessage(error));
  }
}
