import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHighlight extends Document {
  userId: string;
  articleId: mongoose.Types.ObjectId;
  textSnippet: string;
  note?: string;
  colorCode: string; // e.g. 'yellow', 'blue', 'green'
  createdAt: Date;
  updatedAt: Date;
}

const HighlightSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    textSnippet: { type: String, required: true },
    note: { type: String },
    colorCode: { type: String, default: 'yellow' }
  },
  { timestamps: true }
);

// Prevent exact duplicate highlights on the same text snippet for the same user
HighlightSchema.index({ userId: 1, articleId: 1, textSnippet: 1 }, { unique: true });

const Highlight: Model<IHighlight> = mongoose.models.Highlight || mongoose.model<IHighlight>('Highlight', HighlightSchema);

export default Highlight;
