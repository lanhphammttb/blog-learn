import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoadmapPhase {
  _id?: string | mongoose.Types.ObjectId;
  title: string;
  description: string;
  order: number;
  project?: {
    title: string;
    requirements: string;
    passing_score: number;
  };
  items: {
    articleId: mongoose.Types.ObjectId;
    order: number;
    title: string;
    type: 'Grammar' | 'Vocabulary' | 'Practice';
    is_core: boolean;
  }[];
}

export interface IRoadmap extends Document {
  title: string;
  slug: string;
  description: string;
  phases: IRoadmapPhase[];
  roadmap_image_url?: string;
  target_outcome?: string;
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
    roadmap_image_url: { type: String },
    target_outcome: { type: String },
    phases: [
      {
        title: { type: String, required: true },
        description: { type: String },
        order: { type: Number, default: 0 },
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
            is_core: { type: Boolean, default: true },
          },
        ],
        project: {
          title: { type: String },
          requirements: { type: String },
          passing_score: { type: Number, default: 0 }
        }
      }
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

if (mongoose.models.Roadmap) {
  delete mongoose.models.Roadmap;
}
const Roadmap: Model<IRoadmap> = mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);

export default Roadmap;
