import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUserProgress extends Document {
  userId: string; // From NextAuth session
  roadmapId: mongoose.Types.ObjectId;
  completedArticles: mongoose.Types.ObjectId[]; // Array of article IDs completed in this roadmap
  lastUpdated: Date;
}

const UserProgressSchema: Schema = new Schema(
  {
    userId: { type: String, required: true },
    email: { type: String }, // Secondary stable identifier
    roadmapId: { type: Schema.Types.ObjectId, ref: 'Roadmap', required: true },
    completedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    lastUpdated: { type: Date, default: Date.now },
  }
);

// Unique progress record per user per roadmap
UserProgressSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

const UserProgress: Model<IUserProgress> = mongoose.models.UserProgress || mongoose.model<IUserProgress>('UserProgress', UserProgressSchema);

export default UserProgress;
