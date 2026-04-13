import { Link } from '@/navigation';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <div className="relative mb-8">
          <p className="text-[120px] font-black text-border leading-none select-none">404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="h-16 w-16 text-muted-foreground/40" />
          </div>
        </div>

        <h1 className="text-2xl font-black text-foreground mb-3">Trang không tìm thấy</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Trang bạn đang tìm không tồn tại hoặc đã bị xóa. Hãy kiểm tra lại URL hoặc quay về trang chủ.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-colors"
          >
            <Home className="h-4 w-4" />
            Về trang chủ
          </Link>
          <Link
            href="/roadmaps"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3 text-sm font-bold text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Xem Roadmaps
          </Link>
        </div>
      </div>
    </div>
  );
}
