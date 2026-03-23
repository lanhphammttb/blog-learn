import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoadmap extends Document {
  title: string;
  slug: string;
  description: string;
  items: {
    articleId: mongoose.Types.ObjectId;
    order: number;
    title: string;
    type: 'Grammar' | 'Vocabulary' | 'Practice';
  }[];
  author: string; // For now just "Admin" or a User ID
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    items: [
      {
        articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
        order: { type: Number, required: true },
        title: { type: String },
        type: { 
          type: String, 
          enum: ['Grammar', 'Vocabulary', 'Practice'],
          default: 'Grammar'
        },
      },
    ],
    author: { type: String, default: 'Admin' },
    difficulty: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Roadmap: Model<IRoadmap> = mongoose.models.Roadmap || mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);

export default Roadmap;
