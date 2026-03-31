'use client';

import { useState, useEffect, useRef } from 'react';
import { PenTool, X, Save, Plus, Palette } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function QuickNote({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('bg-card');
  const [isSaving, setIsSaving] = useState(false);
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { id: 'bg-card', name: 'Default', hex: 'var(--card)' },
    { id: 'bg-red-500/10 dark:bg-red-900/20', name: 'Red', hex: '#ef4444' },
    { id: 'bg-blue-500/10 dark:bg-blue-900/20', name: 'Blue', hex: '#3b82f6' },
    { id: 'bg-green-500/10 dark:bg-green-900/20', name: 'Green', hex: '#22c55e' },
    { id: 'bg-yellow-500/10 dark:bg-yellow-900/20', name: 'Yellow', hex: '#eab308' },
    { id: 'bg-purple-500/10 dark:bg-purple-900/20', name: 'Purple', hex: '#a855f7' }
  ];

  // Bắt sự kiện bàn phím (Ctrl + /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ctrl + / or cmd + /
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus ô nhập Tiêu đề khi mở
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isLoggedIn) return null;

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return;

    setIsSaving(true);
    let articleId = null;
    
    // Nếu đang ở trang bài đọc, tự động lưu articleId
    if (pathname.includes('/articles/')) {
        const slug = pathname.split('/').pop();
        // (Trong thực tế nên GET từ API để lấy chính xác ID, nhưng tạm thời lưu Note tự dính với url/slug là được. 
        // Tuy nhiên do Schema yêu cầu ObjectId, ta sẽ bỏ qua ở đây. Người dùng vẫn đọc được Title bài chèn vào Note.)
    }

    try {
      const res = await fetch('/api/user/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           title, 
           content,
           color,
           tags: pathname.includes('/articles/') ? ['Article Note'] : ['Quick Note']
        })
      });

      if (res.ok) {
        // Cần hiệu ứng bay icon hoặc toast báo thành công
        setTitle('');
        setContent('');
        setIsOpen(false);
        // Tùy chọn: document.dispatchEvent(new CustomEvent('note-saved'))
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Nút Bong Bóng FAB */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-[0_0_20px_rgba(37,99,235,0.6)] focus:outline-none"
        title="Quick Note (Ctrl + /)"
      >
        <PenTool className="h-6 w-6" />
      </button>

      {/* Overlay làm mờ background */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-background/40 backdrop-blur-sm transition-all"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over Panel (Sidebar Phải) */}
      <div className={`fixed top-0 right-0 z-[70] h-full w-full max-w-sm transform shadow-2xl transition-transform duration-300 ease-in-out ${color} border-l border-border ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         
         {/* Header */}
         <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-background/50 backdrop-blur-md">
            <h2 className="flex items-center gap-2 text-lg font-black text-foreground">
               <PenTool className="h-5 w-5 text-blue-500" />
               Quick Note
            </h2>
            <button onClick={() => setIsOpen(false)} className="rounded-full p-2 hover:bg-muted text-muted-foreground transition-colors">
               <X className="h-5 w-5" />
            </button>
         </div>

         {/* Form nhập */}
         <div className="flex h-[calc(100vh-140px)] flex-col space-y-4 overflow-y-auto px-6 py-6">
            <input 
              ref={inputRef}
              type="text"
              placeholder="Tiêu đề (VD: Ngữ pháp Câu điều kiện)"
              className="w-full bg-transparent text-xl font-bold font-serif text-foreground outline-none placeholder:text-muted-foreground/50 border-b border-dashed border-border/50 pb-2 focus:border-blue-500 transition-colors"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            
            <textarea
              placeholder="Bạn muốn ghi chép lại điều gì? Hỗ trợ Markdown..."
              className="flex-1 w-full resize-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground/50 font-medium leading-relaxed"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
         </div>

         {/* Footer Actions */}
         <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-border/50 bg-background/80 backdrop-blur-md px-6 py-4">
            
            <div className="flex gap-2 group relative">
               <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
                  <Palette className="h-4 w-4" />
               </button>
               {/* Color Picker popover */}
               <div className="absolute bottom-full left-0 mb-2 hidden gap-2 rounded-2xl bg-card p-2 shadow-xl border border-border group-hover:flex">
                  {colors.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setColor(c.id)}
                      className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${color === c.id ? 'border-foreground' : 'border-transparent'}`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
               </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white shadow-lg transition-all hover:bg-blue-700 hover:shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed hidden:opacity-0"
            >
              {isSaving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Lưu ngay
            </button>
         </div>
      </div>
    </>
  );
}
