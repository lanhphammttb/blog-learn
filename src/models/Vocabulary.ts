import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVocabulary extends Document {
  userId: string;
  word: string;
  definition: string;
  phonetic?: string;
  audioUrl?: string;
  status: 'learning' | 'reviewing' | 'mastered';
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VocabularySchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    word: { type: String, required: true },
    definition: { type: String, required: true },
    phonetic: { type: String },
    audioUrl: { type: String },
    status: { 
      type: String, 
      enum: ['learning', 'reviewing', 'mastered'],
      default: 'learning'
    },
    lastReviewedAt: { type: Date },
    nextReviewAt: { type: Date }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate words per user
VocabularySchema.index({ userId: 1, word: 1 }, { unique: true });

const Vocabulary: Model<IVocabulary> = mongoose.models.Vocabulary || mongoose.model<IVocabulary>('Vocabulary', VocabularySchema);

export default Vocabulary;
