import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INote extends Document {
  userId: string;
  title: string;
  content: string; // Markdown content
  articleId?: mongoose.Types.ObjectId; // Optional link to a specific article
  color: string; // Background color for masonry UI
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NoteSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    articleId: { type: Schema.Types.ObjectId, ref: 'Article' },
    color: { type: String, default: 'bg-card' },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

const Note: Model<INote> = mongoose.models.Note || mongoose.model<INote>('Note', NoteSchema);

export default Note;
