import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProgress extends Document {
  userId: string;
  email?: string;
  roadmapId: mongoose.Types.ObjectId;
  completedArticles: mongoose.Types.ObjectId[];
  completedProjects: string[]; // Stores phase titles or custom IDs
  articleTasks: Array<{
    articleId: mongoose.Types.ObjectId;
    taskIndices: number[];
  }>;
  projectSubmissions: Array<{
    bossId: string;
    content: string; // Link or Text
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: Date;
    feedback?: string;
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
  xpHistory: Array<{
    date: string; // YYYY-MM-DD
    xp: number;
  }>;
  lastUpdated: Date;
}

const UserProgressSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String }, // Secondary stable identifier
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    completedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    completedProjects: [{ type: String }],
    articleTasks: [
      {
        articleId: { type: Schema.Types.ObjectId, ref: 'Article' },
        taskIndices: [Number]
      }
    ],
    projectSubmissions: [
      {
        bossId: String,
        content: String,
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        submittedAt: { type: Date, default: Date.now },
        feedback: String
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
    xpHistory: [
      {
        date: String,
        xp: Number
      }
    ],
    lastUpdated: { type: Date, default: Date.now },
  }
);

// Unique progress record per user per roadmap
UserProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

if (mongoose.models.UserProgress) {
  delete mongoose.models.UserProgress;
}
const UserProgress: Model<IUserProgress> = mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;
