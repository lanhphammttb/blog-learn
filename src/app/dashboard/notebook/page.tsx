'use client';

import { useState, useEffect } from 'react';
import { PenTool, Calendar, Trash2, Tag, Loader2, Sparkles } from 'lucide-react';

interface Note {
  _id: string;
  title: string;
  content: string;
  color: string;
  tags: string[];
  createdAt: string;
}

export default function NotebookPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/user/notes');
      const data = await res.json();
      if (Array.isArray(data)) setNotes(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá Note này chứ?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/notes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNotes(prev => prev.filter(n => n._id !== id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-12 flex flex-col items-start gap-4 border-b border-border/50 pb-8 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-foreground">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg">
              <PenTool className="h-6 w-6" />
            </span>
            My Notebook
          </h1>
          <p className="mt-4 text-muted-foreground font-medium max-w-xl">
             Không gian của riêng bạn. Hãy gõ <kbd className="hidden md:inline-block rounded bg-muted px-2 py-1 mx-1 text-sm font-black border border-border">Ctrl + /</kbd> ở bất cứ đâu để Mở sổ tay. Mọi ý tưởng sẽ được lưu trữ tự động tại đây.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-32 bg-muted/10">
           <div className="h-20 w-20 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
              <Sparkles className="h-10 w-10" />
           </div>
           <h3 className="text-2xl font-black mb-2 text-foreground text-center">Cuốn sổ trống trơn</h3>
           <p className="text-muted-foreground text-center max-w-sm">Mọi thứ bắt đầu từ một ý tưởng nhỏ. Hãy thử bấm <b className="text-foreground">Ctrl + /</b> để tạo Ghi chú đầu tiên trên hành trình Master English nhé!</p>
        </div>
      ) : (
        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4 space-y-6">
          {notes.map(note => (
            <div 
              key={note._id} 
              className={`group relative break-inside-avoid rounded-[28px] border border-border/10 p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl ${note.color === 'bg-card' ? 'bg-card border-border border-2' : note.color}`}
            >
              <button 
                onClick={() => deleteNote(note._id)}
                disabled={deletingId === note._id}
                className="absolute top-4 right-4 rounded-full bg-background/50 p-2 text-muted-foreground backdrop-blur opacity-0 shadow-sm transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
                title="Xóa Note"
              >
                {deletingId === note._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>

              <h2 className="mb-3 pr-8 text-xl font-bold font-serif leading-tight text-foreground uppercase tracking-wide opacity-90">
                {note.title}
              </h2>
              
              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground/90 font-medium leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: note.content }} 
              />
              
              <div className="mt-8 flex items-center justify-between border-t border-current/10 pt-4">
                <span className="flex items-center gap-1.5 text-xs font-bold font-mono opacity-50">
                  <Calendar className="h-3 w-3" />
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
                
                {note.tags.length > 0 && (
                  <div className="flex gap-2">
                    {note.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 rounded bg-background/30 px-2 py-1 text-[10px] uppercase font-black tracking-widest opacity-70">
                        <Tag className="h-3 w-3" /> {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
