import UserProgress from '../../models/UserProgress';
import { IUserProgressRepository } from '../../core/repositories/IUserProgressRepository';
import { UserProgressEntity } from '../../core/entities/UserProgress';
import mongoose from 'mongoose';

export class MongooseUserProgressRepository implements IUserProgressRepository {
  async findByUserAndRoadmap(userId: string, roadmapId: string): Promise<UserProgressEntity | null> {
    const doc = await UserProgress.findOne({
      userId,
      roadmapId: new mongoose.Types.ObjectId(roadmapId)
    }).lean();

    if (!doc) return null;

    return this.toEntity(doc as any);
  }

  async save(progress: UserProgressEntity): Promise<UserProgressEntity> {
    const roadmapId = new mongoose.Types.ObjectId(progress.roadmapId);
    
    // Upsert operation
    const doc = await UserProgress.findOneAndUpdate(
      { userId: progress.userId, roadmapId },
      { 
        $set: { 
          email: progress.email,
          completedArticles: progress.completedArticles.map(id => new mongoose.Types.ObjectId(id)),
          completedProjects: progress.completedProjects,
          projectSubmissions: progress.projectSubmissions,
          xp: progress.xp,
          streak: progress.streak,
          lastActive: progress.lastActive,
          lastUpdated: progress.lastUpdated
        }
      },
      { upsert: true, new: true, lean: true }
    );

    return this.toEntity(doc as any);
  }

  async update(userId: string, roadmapId: string, updates: Partial<UserProgressEntity>): Promise<UserProgressEntity> {
     const doc = await UserProgress.findOneAndUpdate(
        { userId, roadmapId: new mongoose.Types.ObjectId(roadmapId) },
        { $set: updates },
        { new: true, lean: true }
     );
     if (!doc) throw new Error('Progress not found');
     return this.toEntity(doc as any);
  }

  private toEntity(doc: any): UserProgressEntity {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      email: doc.email,
      roadmapId: doc.roadmapId.toString(),
      completedArticles: (doc.completedArticles || []).map((id: any) => id.toString()),
      completedProjects: doc.completedProjects || [],
      projectSubmissions: doc.projectSubmissions || [],
      xp: doc.xp || 0,
      streak: doc.streak || 0,
      lastActive: doc.lastActive,
      lastUpdated: doc.lastUpdated
    };
  }
}
