import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRoadmapPhase {
  _id?: string | mongoose.Types.ObjectId;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  order: number;
  project?: {
    title: string;
    title_en?: string;
    requirements: string;
    requirements_en?: string;
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
  title_en?: string;
  slug: string;
  description: string;
  description_en?: string;
  phases: IRoadmapPhase[];
  roadmap_image_url?: string;
  target_outcome?: string;
  target_outcome_en?: string;
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
    title_en: { type: String },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    description_en: { type: String },
    roadmap_image_url: { type: String },
    target_outcome: { type: String },
    target_outcome_en: { type: String },
    phases: [
      {
        title: { type: String, required: true },
        title_en: { type: String },
        description: { type: String },
        description_en: { type: String },
        order: { type: Number, default: 0 },
        items: [
          {
            articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true },
            order: { type: Number, required: true },
            title: { type: String },
            title_en: { type: String },
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
          title_en: { type: String },
          requirements: { type: String },
          requirements_en: { type: String },
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

// Performance indexes
RoadmapSchema.index({ isPublished: 1, createdAt: -1 });
RoadmapSchema.index({ difficulty: 1, isPublished: 1 });

if (mongoose.models.Roadmap) {
  delete mongoose.models.Roadmap;
}
const Roadmap: Model<IRoadmap> = mongoose.model<IRoadmap>('Roadmap', RoadmapSchema);

export default Roadmap;
