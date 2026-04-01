'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, CheckCircle2, XCircle, Clock, ExternalLink, 
  MessageSquare, Loader2, ChevronLeft, ArrowRight, User, Hash
} from 'lucide-react';
import { Link } from '@/navigation';
import { useToast } from '@/components/ui/Toast';

interface Submission {
  _id: string;
  bossId: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  roadmapTitle: string;
  roadmapId: string;
  userEmail: string;
  userId: string;
  progressId: string;
  feedback?: string;
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchSubmissions = async () => {
    try {
      const res = await fetch('/api/admin/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleReview = async (id: string, bossId: string, status: 'approved' | 'rejected') => {
    setSubmittingReview(bossId);
    try {
      const res = await fetch('/api/admin/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progressId: id,
          bossId,
          status,
          feedback
        })
      });

      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.bossId !== bossId));
        setSelectedSubmission(null);
        setFeedback('');
        showToast(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} bài nộp thành công!`, 'success');
      } else {
        showToast('Có lỗi xảy ra khi xử lý bài nộp.', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối Server.', 'error');
      console.error(e);
    } finally {
      setSubmittingReview(null);
    }
  };

  const isLink = (content: string) => content.startsWith('http://') || content.startsWith('https://');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 mb-6 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Dashboard
        </Link>
        
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight mb-2">Đợi Chấm Bài</h1>
          <p className="text-muted-foreground text-lg">Phê duyệt và phản hồi bài nghiên cứu Boss của học viên.</p>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center bg-muted/20 rounded-3xl border border-border mt-8">
            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 gap-4 bg-muted/20 rounded-3xl border border-dashed border-border mt-8">
            <div className="h-20 w-20 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
               <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="font-bold text-xl">Tuyệt vời! Không còn bài nào chờ chấm.</p>
            <p className="text-muted-foreground max-w-xs text-center">Tất cả học viên đều đang học bài hoặc bạn đã hoàn thành công việc rồi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* List Section */}
            <div className="space-y-4">
              {submissions.map((sub, i) => (
                <div 
                  key={sub.bossId + i}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`group relative overflow-hidden rounded-[32px] border-2 transition-all cursor-pointer ${selectedSubmission?.bossId === sub.bossId ? 'border-blue-600 bg-blue-500/5 ring-4 ring-blue-500/10' : 'border-border bg-card'}`}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                            <Trophy className="h-5 w-5" />
                         </div>
                         <div>
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phá Đảo Boss</p>
                            <p className="font-bold text-lg">{sub.roadmapTitle}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(sub.submittedAt).toLocaleDateString()}
                         </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 py-3 border-y border-border/50">
                       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                          <User className="h-5 w-5 text-muted-foreground" />
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-sm font-black truncate">{sub.userEmail || 'Học viên EnglishHub'}</p>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none">ID: {sub.userId.substring(0, 8)}...</p>
                       </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                       <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold bg-orange-500/10 text-orange-600">
                         <span className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse"></span>
                         Chờ Duyệt
                       </span>
                       <ArrowRight className={`h-5 w-5 text-muted-foreground group-hover:text-blue-600 transition-all ${selectedSubmission?.bossId === sub.bossId ? 'translate-x-1' : ''}`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Section */}
            <div className="lg:sticky lg:top-8 h-fit">
              {selectedSubmission ? (
                <div className="rounded-[40px] border border-border bg-card shadow-2xl p-8 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-500">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="h-16 w-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                        <MessageSquare className="h-8 w-8" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase text-blue-600 tracking-[0.2em]">Hồ sơ Bài nộp</p>
                        <h2 className="text-2xl font-black">{selectedSubmission.roadmapTitle}</h2>
                     </div>
                  </div>

                  <div className="space-y-6">
                    <section>
                       <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Nội dung học viên nộp:</p>
                       <div className="p-6 rounded-3xl bg-muted/40 border border-border font-medium leading-relaxed italic">
                          "{selectedSubmission.content}"
                          {isLink(selectedSubmission.content) && (
                            <div className="mt-4 pt-4 border-t border-border/50">
                               <a 
                                 href={selectedSubmission.content} 
                                 target="_blank" 
                                 className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background font-bold text-sm hover:opacity-90 transition-all shadow-xl shadow-foreground/10"
                               >
                                  Mở link bài nộp <ExternalLink className="h-4 w-4" />
                               </a>
                            </div>
                          )}
                       </div>
                    </section>

                    <section className="space-y-3">
                       <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Phản hồi của Admin (Tuỳ chọn):</p>
                       <textarea 
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Chia sẻ nhận xét hoặc hướng dẫn thêm cho học viên..."
                          className="w-full h-32 rounded-3xl bg-background border-2 border-border p-5 text-sm font-medium focus:border-blue-600 outline-none transition-all"
                       />
                    </section>

                    <div className="flex gap-4 pt-4">
                       <button 
                         disabled={submittingReview !== null}
                         onClick={() => handleReview(selectedSubmission.progressId, selectedSubmission.bossId, 'rejected')}
                         className="flex-1 py-4 rounded-3xl bg-red-500/10 text-red-600 font-black uppercase tracking-widest text-xs hover:bg-red-500/20 transition-all border border-red-500/20 active:scale-95"
                       >
                          Từ Chối
                       </button>
                       <button 
                         disabled={submittingReview !== null}
                         onClick={() => handleReview(selectedSubmission.progressId, selectedSubmission.bossId, 'approved')}
                         className="flex-[2] py-4 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/30 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                       >
                          {submittingReview ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Phê Duyệt & Cho Qua'}
                       </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-96 rounded-[40px] border-2 border-dashed border-border flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-muted/10">
                   <Hash className="h-12 w-12 mb-4 opacity-20" />
                   <p className="font-bold text-lg">Chọn một bài nộp để chấm điểm</p>
                   <p className="text-sm max-w-[240px] mt-2">Duyệt nhanh - Học giỏi. Thành bại của học viên nằm trong tay bạn!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
