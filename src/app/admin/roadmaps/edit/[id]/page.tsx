'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Save, X, Sparkles, ChevronLeft, Loader2, 
  Layers, Plus, GripVertical, Trash2, Search, Target
} from 'lucide-react';
import Link from 'next/link';

interface RoadmapItem {
  articleId: any;
  title: string;
  order: number;
  type: 'Grammar' | 'Vocabulary' | 'Practice';
  is_core?: boolean;
}

interface RoadmapPhase {
  title: string;
  description: string;
  order: number;
  items: RoadmapItem[];
  project?: {
    title: string;
    requirements: string;
    passing_score: number;
  };
}

export default function EditRoadmap() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [articles, setArticles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Track which phase is currently receiving injected articles
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(0);
  
  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    roadmap_image_url: string;
    target_outcome: string;
    difficulty: string;
    isPublished: boolean;
    phases: RoadmapPhase[];
  }>({
    title: '',
    slug: '',
    description: '',
    roadmap_image_url: '',
    target_outcome: '',
    difficulty: 'Intermediate',
    isPublished: true,
    phases: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [articlesRes, roadmapRes] = await Promise.all([
          fetch('/api/articles'),
          fetch(`/api/roadmaps/${id}`)
        ]);
        
        if (articlesRes.ok && roadmapRes.ok) {
          const articlesData = await articlesRes.json();
          const roadmapData = await roadmapRes.json();
          setArticles(articlesData);
          
          // Migrate old flat items to a default phase if 'phases' is empty
          if (!roadmapData.phases || roadmapData.phases.length === 0) {
             const defaultPhase = {
                title: "Giai đoạn 1",
                description: "Nền tảng khởi đầu",
                order: 0,
                items: roadmapData.items || []
             };
             setFormData({ ...roadmapData, phases: [defaultPhase], items: undefined });
          } else {
             setFormData(roadmapData);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const addPhase = () => {
     setFormData(prev => ({
       ...prev,
       phases: [
         ...prev.phases, 
         { title: `Giai đoạn ${prev.phases.length + 1}`, description: '', order: prev.phases.length, items: [] }
       ]
     }));
     setActivePhaseIndex(formData.phases.length);
  };

  const removePhase = (phaseIndex: number) => {
     if (!confirm('Xóa giai đoạn này sẽ xóa toàn bộ bài học bên trong. Bạn chắc chưa?')) return;
     setFormData(prev => ({
        ...prev,
        phases: prev.phases.filter((_, i) => i !== phaseIndex)
     }));
     if (activePhaseIndex >= phaseIndex) {
        setActivePhaseIndex(Math.max(0, activePhaseIndex - 1));
     }
  };

  const updatePhase = (index: number, field: keyof RoadmapPhase | 'project.title' | 'project.requirements', value: string) => {
     setFormData(prev => {
        const newPhases = [...prev.phases];
        if (field.startsWith('project.')) {
            const subField = field.split('.')[1] as 'title' | 'requirements';
            newPhases[index] = { 
               ...newPhases[index], 
               project: { 
                 ...(newPhases[index].project || { title: '', requirements: '', passing_score: 0 }), 
                 [subField]: value 
               } 
            };
        } else {
            newPhases[index] = { ...newPhases[index], [field as keyof RoadmapPhase]: value };
        }
        return { ...prev, phases: newPhases };
     });
  };

  const updateArticle = (phaseIndex: number, articleId: string, updates: Partial<RoadmapItem>) => {
    setFormData(prev => {
       const newPhases = [...prev.phases];
       newPhases[phaseIndex] = {
           ...newPhases[phaseIndex],
           items: newPhases[phaseIndex].items.map(item => 
               (item.articleId?._id || item.articleId) === articleId ? { ...item, ...updates } : item
           )
       };
       return { ...prev, phases: newPhases };
    });
  };

  const addArticleToActivePhase = (article: any) => {
    if (formData.phases.length === 0) {
       alert('Hãy tạo ít nhất một Giai đoạn (Phase) trước khi thêm bài học!');
       return;
    }
    
    // Check if article already exists anywhere
    for (const phase of formData.phases) {
        if (phase.items.some(item => (item.articleId?._id || item.articleId) === article._id)) {
            alert('Bài học này đã có trong Roadmap!');
            return;
        }
    }
    
    setFormData(prev => {
       const newPhases = [...prev.phases];
       newPhases[activePhaseIndex] = {
           ...newPhases[activePhaseIndex],
           items: [
               ...newPhases[activePhaseIndex].items,
               { 
                   articleId: article._id, 
                   title: article.title, 
                   order: newPhases[activePhaseIndex].items.length, 
                   type: 'Grammar',
                   is_core: true
               }
           ]
       };
       return { ...prev, phases: newPhases };
    });
  };

  const removeArticle = (phaseIndex: number, articleId: string) => {
    setFormData(prev => {
       const newPhases = [...prev.phases];
       newPhases[phaseIndex] = {
           ...newPhases[phaseIndex],
           items: newPhases[phaseIndex].items.filter(item => 
               (item.articleId?._id || item.articleId) !== articleId
           )
       };
       return { ...prev, phases: newPhases };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/roadmaps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        alert('Failed to update roadmap');
      }
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev: any) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev: any) => ({ ...prev, [name]: value }));
    }
  };

  // Filter out articles already in any phase
  const isArticleUsed = (articleId: string) => {
     for (const phase of formData.phases) {
         if (phase.items.some(item => (item.articleId?._id || item.articleId) === articleId)) return true;
     }
     return false;
  };

  const filteredArticles = articles.filter(a => 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !isArticleUsed(a._id)
  );

  if (fetching) {
     return (
       <div className="flex h-[60vh] items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
       </div>
     );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Về Dashboard
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground flex items-center gap-3">
            <Layers className="h-8 w-8 text-blue-500" />
            Edit Roadmap Phases
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Sequencing Editor: PHASES */}
        <div className="lg:col-span-2 space-y-8">
          
          {formData.phases.map((phase, pIndex) => (
             <div 
                key={pIndex} 
                className={`rounded-[32px] border-2 bg-card p-6 md:p-8 shadow-xl transition-all ${activePhaseIndex === pIndex ? 'border-blue-500 shadow-blue-500/20 ring-4 ring-blue-500/10' : 'border-border/50 opacity-80 hover:opacity-100'}`}
                onClick={() => setActivePhaseIndex(pIndex)}
             >
                <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="flex-1 space-y-4">
                      <div>
                         <label className="text-xs font-bold text-muted-foreground uppercase">Tên Giai Đoạn {pIndex + 1}</label>
                         <input 
                            value={phase.title}
                            onChange={(e) => updatePhase(pIndex, 'title', e.target.value)}
                            className="text-2xl font-black bg-transparent border-b-2 border-border/50 outline-none w-full focus:border-blue-500 py-1"
                            placeholder="VD: Căn bản Giao Tiếp"
                         />
                      </div>
                      <div>
                         <input 
                            value={phase.description}
                            onChange={(e) => updatePhase(pIndex, 'description', e.target.value)}
                            className="text-sm font-medium text-muted-foreground bg-transparent border-b border-border/50 outline-none w-full focus:border-blue-500 py-1"
                            placeholder="Mô tả mục tiêu của giai đoạn này..."
                         />
                      </div>
                      
                      <div className="pt-4 border-t border-border/50">
                         <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 mb-2"><Target className="h-4 w-4" /> Dự án chốt chặng (Boss Milestone)</label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input 
                              value={phase.project?.title || ''}
                              onChange={(e) => updatePhase(pIndex, 'project.title', e.target.value)}
                              className="text-sm border border-border bg-card rounded-xl p-2.5 outline-none focus:border-blue-500"
                              placeholder="Tên bài tập/Boss"
                           />
                           <input 
                              value={phase.project?.requirements || ''}
                              onChange={(e) => updatePhase(pIndex, 'project.requirements', e.target.value)}
                              className="text-sm border border-border bg-card rounded-xl p-2.5 outline-none focus:border-blue-500"
                              placeholder="Yêu cầu cần đạt để qua ải"
                           />
                         </div>
                      </div>
                   </div>
                   <div className="flex items-start gap-2 pt-4">
                      <button 
                         type="button"
                         onClick={(e) => { e.stopPropagation(); removePhase(pIndex); }}
                         className="h-10 w-10 shrink-0 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                      >
                         <Trash2 className="h-5 w-5" />
                      </button>
                   </div>
                </div>

                {/* Sub-items in Phase */}
                <div className="space-y-3 bg-muted/20 rounded-2xl p-4 md:p-6 border border-border/50">
                   <div className="flex items-center justify-between mb-2">
                       <h4 className="font-bold text-sm uppercase text-foreground">Bài học lộ trình</h4>
                       {activePhaseIndex === pIndex && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-full animate-pulse">Đang Click thêm vào đây</span>}
                   </div>

                   {phase.items.length === 0 ? (
                       <p className="text-xs text-muted-foreground italic py-4 text-center">Chưa có bài học. Mời mạn chọn từ Menu Bên Phải!</p>
                   ) : (
                       phase.items.map((item, index) => (
                          <div key={`${item.articleId?._id || item.articleId}-${index}`} className="flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border border-border group">
                             <div className="h-8 w-8 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/20">
                                {index + 1}
                             </div>
                             <div className="flex-grow">
                                <p className="font-bold text-sm text-foreground">{item.title}</p>
                             </div>
                             
                             {/* Core Toggle */}
                             <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); updateArticle(pIndex, item.articleId?._id || item.articleId, { is_core: item.is_core === false ? true : false }); }}
                                className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${item.is_core !== false ? 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-500/20' : 'bg-muted text-muted-foreground border-border'}`}
                             >
                                {item.is_core !== false ? '★ Core' : '○ Vệ Tinh'}
                             </button>

                             <button 
                               type="button" 
                               onClick={(e) => { e.stopPropagation(); removeArticle(pIndex, item.articleId?._id || item.articleId); }}
                               className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                             >
                                <X className="h-4 w-4" />
                             </button>
                          </div>
                       ))
                   )}
                </div>
             </div>
          ))}

          <button 
             type="button"
             onClick={addPhase}
             className="w-full py-8 border-4 border-dashed border-blue-500/30 rounded-[32px] text-blue-500 font-bold uppercase tracking-widest hover:bg-blue-500/5 hover:border-blue-500/50 transition-all flex items-center justify-center gap-2"
          >
             <Plus className="h-6 w-6" /> Thêm Giai Đoạn Mới (Phase)
          </button>
        </div>

        {/* Sidebar Settings & Selector */}
        <div className="space-y-6 sticky top-24">
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-xl space-y-6">
            <h2 className="text-lg font-bold text-foreground">Roadmap Settings</h2>
            
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
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">URL Slug</label>
                <input
                  required
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-xs text-foreground outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Image URL</label>
                <input
                  name="roadmap_image_url"
                  value={formData.roadmap_image_url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target Outcome</label>
                <input
                  name="target_outcome"
                  value={formData.target_outcome}
                  onChange={handleChange}
                  placeholder="VD: IELTS 6.5, Giao tiếp cơ bản..."
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground outline-none appearance-none"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3 pt-4 border-t border-border">
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
          </div>

          <div className="rounded-[32px] border-4 border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 p-6 shadow-xl space-y-4">
             <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Target className="h-5 w-5" />
                <h2 className="text-sm font-bold uppercase tracking-widest">Kho Bài Đọc</h2>
             </div>
             <p className="text-[10px] text-muted-foreground uppercase">Click Bài đọc để tự động nhét vào Phase đang chọn bên trái (Viền Xanh)</p>
             
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input 
                   placeholder="Search..."
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   className="w-full rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-card py-2 pl-9 pr-4 text-xs outline-none focus:ring-2 focus:ring-blue-500/20"
                />
             </div>

             <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {formData.phases.length === 0 ? (
                    <p className="text-red-500 font-bold text-xs py-4 text-center">Tạo 1 Phase bên trái trước đã!</p>
                ) : articles.length > 0 ? (
                   filteredArticles.map(article => (
                      <button
                        key={article._id}
                        type="button"
                        onClick={() => addArticleToActivePhase(article)}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 text-left hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all text-xs group shadow-sm"
                      >
                         <span className="font-medium line-clamp-1">{article.title}</span>
                         <Plus className="h-4 w-4 text-blue-500 group-hover:text-white" />
                      </button>
                   ))
                ) : (
                   <p className="text-center py-4 text-[10px] text-muted-foreground italic">Đã hết bài đọc khả dụng!</p>
                )}
             </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 text-sm font-bold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)] disabled:opacity-50"
          >
            {loading ? 'Saving...' : (
              <>
                <Save className="h-5 w-5" />
                Lưu Hệ Thống
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
