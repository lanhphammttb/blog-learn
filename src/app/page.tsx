import Link from 'next/link';
import { Sparkles, ArrowRight, BookOpen, Rocket, Target } from 'lucide-react';
import dbConnect from '@/lib/db';
import Article from '@/models/Article';
import ArticleCard from '@/components/ArticleCard';
import Roadmap from '@/models/Roadmap';
import SearchBar from '@/components/SearchBar';
import Pagination from '@/components/Pagination';

const ARTICLES_PER_PAGE = 9;

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || '1', 10));

  await dbConnect();

  // Count total published articles for pagination
  const totalArticles = await Article.countDocuments({ isPublished: true });
  const totalPages = Math.ceil(totalArticles / ARTICLES_PER_PAGE);
  
  // Fetch paginated articles
  const allArticles = await Article.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .skip((currentPage - 1) * ARTICLES_PER_PAGE)
    .limit(ARTICLES_PER_PAGE)
    .lean();

  // Fetch featured roadmaps
  const roadmaps = await Roadmap.find({ isPublished: true })
    .limit(3)
    .lean();

  return (
    <div className="relative isolate px-6 pt-14 lg:px-8 bg-background">
      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-10 dark:opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="mx-auto max-w-7xl py-12">
        {/* Simplified Hero Section */}
        <div className="text-center mb-24">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-bold text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500/20">
            <Sparkles className="h-4 w-4" />
            <span>Smart English Learning Platform</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-7xl mb-6">
            Level up your <span className="gradient-text">English</span> skills.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10 leading-relaxed">
            Personalized learning paths, daily lessons, and structured roadmaps to master English comfortably.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <Link 
               href="/roadmaps" 
               className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 font-bold text-white shadow-xl shadow-blue-500/20 transition-all hover:bg-blue-500 hover:scale-105"
             >
                <Rocket className="h-5 w-5" />
                Explore Roadmaps
             </Link>
             <SearchBar />
          </div>
        </div>

        {/* Featured Roadmaps Section */}
        {roadmaps.length > 0 && (
          <div className="mb-24">
             <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Target className="h-6 w-6 text-blue-500" />
                   <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Structured Paths</h2>
                </div>
                <Link href="/roadmaps" className="text-sm font-bold text-blue-500 hover:underline flex items-center gap-1">
                   View all <ArrowRight className="h-4 w-4" />
                </Link>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {roadmaps.map((map: any) => (
                   <Link 
                     key={map._id.toString()} 
                     href={`/roadmaps/${map.slug}`}
                     className="group flex flex-col p-6 rounded-3xl bg-card border border-border transition-all hover:border-blue-500/50 hover:shadow-xl"
                   >
                      <div className={`mb-4 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${map.difficulty === 'Beginner' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                         {map.difficulty}
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-blue-600 transition-colors">{map.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{map.description}</p>
                      <div className="mt-auto flex items-center justify-between">
                         <span className="text-xs font-bold text-muted-foreground">{map.items.length} Lessons</span>
                         <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-blue-500 transition-all" />
                      </div>
                   </Link>
                ))}
             </div>
          </div>
        )}

        {/* Latest Lessons */}
        <div className="mb-8 flex items-center gap-3">
          <BookOpen className="h-6 w-6 text-blue-500" />
          <h2 className="text-2xl font-black text-foreground uppercase tracking-tight">Latest Lessons</h2>
        </div>
        
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {allArticles.length > 0 ? (
            allArticles.map((article: any) => (
              <ArticleCard key={article._id.toString()} article={JSON.parse(JSON.stringify(article))} />
            ))
          ) : (
             <div className="col-span-full py-20 text-center">
                <h3 className="text-xl font-medium text-foreground mb-2">No lessons found</h3>
                <Link
                  href="/admin/new"
                  className="text-blue-500 hover:underline"
                >
                  Create one now
                </Link>
             </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={totalPages} basePath="/" />
      </div>
    </div>
  );
}
