import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import UserProgress from "@/models/UserProgress";
import mongoose from "mongoose";
import { rateLimit, getClientId, rateLimitResponse } from '@/lib/rateLimit';

export async function GET(request: Request) {
  const clientId = getClientId(request);
  const { success, resetTime } = rateLimit(`leaderboard:${clientId}`, { limit: 20, windowSeconds: 60 });
  if (!success) return rateLimitResponse(resetTime);

  try {
    await dbConnect();

    // Get all user progress records
    // We want to aggregate: Total lessons, distinct roadmaps, and latest activity
    const leaderboard = await UserProgress.aggregate([
      {
        $project: {
          userId: 1,
          lessonCount: { $size: "$completedArticles" },
          roadmapCount: 1, // This is always 1 per record, but we could group by userId
        }
      },
      {
        $group: {
          _id: "$userId",
          totalLessons: { $sum: "$lessonCount" },
          totalRoadmaps: { $count: {} },
        }
      },
      {
        $sort: { totalLessons: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Note: In a real app with User models, we'd join with the User collection to get names/images
    // For this prototype, we'll return the IDs and some placeholder names if we can't find the user
    // Since NextAuth manages the 'users' collection, we can try to find them if we have access to the collection name
    
    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');
    
    const detailedLeaderboard = await Promise.all(leaderboard.map(async (entry) => {
      let user = null;
      try {
        if (usersCollection) {
          user = await usersCollection.findOne({ 
            $or: [
              { _id: new mongoose.Types.ObjectId(entry._id) },
              { _id: entry._id } // Some adapters use string IDs
            ]
          });
        }
      } catch (e) {}

      return {
        id: entry._id.toString(),
        name: user?.name || "Anonymous Learner",
        image: user?.image || null,
        totalLessons: entry.totalLessons,
        totalRoadmaps: entry.totalRoadmaps,
        rank: 0 // Will be set in the frontend
      };
    }));

    return Response.json(detailedLeaderboard);
  } catch (error: any) {
    console.error("Leaderboard API Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
