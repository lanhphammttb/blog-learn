'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, X, Sparkles, ChevronLeft, Loader2, Eye, Edit3,
  Bold, Italic, Link as LinkIcon, List, Type, 
  BookOpen, Hash, Layers
} from 'lucide-react';
import Link from 'next/link';
import MarkdownRenderer from '@/components/MarkdownRenderer';

export default function EditArticle() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'Grammar',
    difficulty: 'Intermediate',
    series: '',
    tags: '',
    isPublished: true,
  });

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/articles/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            ...data,
            tags: data.tags.join(', '),
            difficulty: data.difficulty || 'Intermediate',
            series: data.series || '',
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchArticle();
  }, [id]);

  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const beforeText = text.substring(0, start);
    const selectedText = text.substring(start, end);
    const afterText = text.substring(end);

    const newText = beforeText + before + selectedText + after + afterText;
    setFormData({ ...formData, content: newText });
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const addVocabularyTemplate = () => {
    const template = `
### 📚 Vocabulary
- **Word**: [Definition]
  *Example: [Sentence]*
`;
    setFormData({ ...formData, content: formData.content + template });
  };

  const addGrammarTemplate = () => {
    const template = `
### ✍️ Grammar Point: [Topic]
**Rule**: [Explanation]
**Examples**:
1. [Example 1]
2. [Example 2]
`;
    setFormData({ ...formData, content: formData.content + template });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tagsArray = formData.tags.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '');

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tags: tagsArray,
        }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        alert('Failed to update article');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (fetching) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-500" />
            Edit English Lesson
          </h1>
        </div>

        <div className="flex rounded-2xl bg-card p-1 border border-border shadow-sm">
          <button
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl transition-all ${viewMode === 'edit' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Edit3 className="h-4 w-4" />
            Write
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-semibold rounded-xl transition-all ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl">
            {viewMode === 'edit' ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-border">
                  <button type="button" onClick={() => insertText('**', '**')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Bold"><Bold className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertText('_', '_')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Italic"><Italic className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertText('# ')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Heading"><Type className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertText('- ')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="List"><List className="h-4 w-4" /></button>
                  <button type="button" onClick={() => insertText('[', '](url)')} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Link"><LinkIcon className="h-4 w-4" /></button>
                  <div className="mx-2 h-4 w-px bg-border" />
                  <button type="button" onClick={addVocabularyTemplate} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold hover:bg-blue-500/20 transition-all">
                    + Vocabulary
                  </button>
                  <button type="button" onClick={addGrammarTemplate} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all">
                    + Grammar Point
                  </button>
                </div>

                <textarea
                  id="content-editor"
                  required
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  rows={20}
                  className="w-full bg-transparent p-2 font-mono text-sm leading-relaxed text-foreground outline-none resize-none placeholder-muted-foreground/50"
                />
              </div>
            ) : (
              <div className="min-h-[500px] overflow-y-auto">
                {formData.title && <h1 className="text-4xl font-extrabold text-foreground mb-8">{formData.title}</h1>}
                <MarkdownRenderer content={formData.content} />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
               <Sparkles className="h-5 w-5 text-blue-500" />
               Lesson Settings
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Title</label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Difficulty</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, difficulty: level as any })}
                      className={`px-2 py-2 text-[10px] font-bold rounded-lg border transition-all ${formData.difficulty === level ? 'bg-blue-600 border-blue-600 text-white' : 'border-border bg-muted/30 text-muted-foreground'}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Learning Path / Series</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="series"
                    value={formData.series}
                    onChange={handleChange}
                    placeholder="e.g. Grammar Masterclass"
                    className="w-full rounded-xl border border-border bg-muted/30 p-3 pl-10 text-sm text-foreground outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none appearance-none"
                >
                  <option value="Daily Lesson">Daily Lesson</option>
                  <option value="Grammar">Grammar</option>
                  <option value="Vocabulary">Vocabulary</option>
                  <option value="Idioms">Idioms</option>
                  <option value="Tips">Tips</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Excerpt</label>
                <textarea
                  required
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none resize-none"
                />
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <input
                  type="checkbox"
                  name="isPublished"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={handleChange}
                  className="h-5 w-5 rounded-lg border-border bg-muted text-blue-600 focus:ring-blue-500/20"
                />
                <label htmlFor="isPublished" className="text-sm font-medium text-foreground">
                  Published
                </label>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] disabled:opacity-50"
              >
                {loading ? 'Saving...' : (
                  <>
                    <Save className="h-5 w-5" />
                    Update Lesson
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
