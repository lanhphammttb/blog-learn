import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProgress extends Document {
  userId: string;
  email?: string;
  roadmapId: mongoose.Types.ObjectId;
  completedArticles: mongoose.Types.ObjectId[];
  articleTasks: Array<{
    articleId: mongoose.Types.ObjectId;
    taskIndices: number[];
  }>;
  xp: number;
  streak: number;
  lastActive: Date;
  vocabularyStates: Array<{
    word: string;
    status: 'learning' | 'mastered';
    lastReviewed: Date;
    nextReview: Date;
    interval: number;
  }>;
  lastUpdated: Date;
}

const UserProgressSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String }, // Secondary stable identifier
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    completedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    articleTasks: [
      {
        articleId: { type: Schema.Types.ObjectId, ref: 'Article' },
        taskIndices: [Number]
      }
    ],
    xp: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    vocabularyStates: [
      {
        word: String,
        status: { type: String, enum: ['learning', 'mastered'], default: 'learning' },
        lastReviewed: { type: Date, default: Date.now },
        nextReview: { type: Date, default: Date.now },
        interval: { type: Number, default: 1 }
      }
    ],
    lastUpdated: { type: Date, default: Date.now },
  }
);

// Unique progress record per user per roadmap
UserProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

const UserProgress: Model<IUserProgress> = mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;
