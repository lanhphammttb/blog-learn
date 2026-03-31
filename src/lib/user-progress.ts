import mongoose from 'mongoose';
import UserProgress from '@/models/UserProgress';

export async function awardXp(userId: string, roadmapId: string | mongoose.Types.ObjectId, xpAmount: number) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // 1. Check if history for today exists
    const progress = await UserProgress.findOne({
      userId,
      roadmapId: new mongoose.Types.ObjectId(roadmapId.toString()),
      'xpHistory.date': today
    });

    if (progress) {
      // Update existing day
      return await UserProgress.findOneAndUpdate(
        { userId, roadmapId: new mongoose.Types.ObjectId(roadmapId.toString()), 'xpHistory.date': today },
        { 
          $inc: { xp: xpAmount, 'xpHistory.$.xp': xpAmount },
          $set: { lastActive: new Date(), lastUpdated: new Date() }
        },
        { returnDocument: 'after' }
      );
    } else {
      // Push new day
      return await UserProgress.findOneAndUpdate(
        { userId, roadmapId: new mongoose.Types.ObjectId(roadmapId.toString()) },
        { 
          $inc: { xp: xpAmount },
          $push: { xpHistory: { date: today, xp: xpAmount } },
          $set: { lastActive: new Date(), lastUpdated: new Date() }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (error) {
    console.error('Error awarding XP:', error);
    throw error;
  }
}
