import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  title_en?: string;
  slug: string;
  content: string; // Markdown content
  content_en?: string;
  excerpt: string;
  excerpt_en?: string;
  category: string;
  tags: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  series: string; // Internal grouping name
  thumbnailUrl?: string;
  relatedArticles: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
}

const ArticleSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    title_en: { type: String },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    content_en: { type: String },
    thumbnailUrl: { type: String },
    excerpt: { type: String },
    excerpt_en: { type: String },
    category: { type: String, default: 'General' },
    tags: [{ type: String }],
    difficulty: { 
      type: String, 
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate'
    },
    series: { type: String, default: '' },
    relatedArticles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent re-defining the model if it already exists (Next.js hot reloading)
const Article: Model<IArticle> = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;
