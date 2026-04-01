'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter, Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { 
  Menu, X, BookOpen, Layers, User, LogOut, 
  Settings, ChevronDown, Sparkles, Moon, Sun, Users
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('Common');
  const navT = useTranslations('Roadmap');
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: t('nav.home'), href: '/', icon: BookOpen },
    { name: navT('title'), href: '/roadmaps', icon: Layers },
    { name: t('nav.community'), href: '/community', icon: Users },
    { name: t('nav.my_learning'), href: '/dashboard', icon: User, hidden: !session },
  ].filter(l => !l.hidden);

  const isAdmin = (session?.user as any)?.role === 'admin';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border py-3 shadow-lg' : 'bg-transparent py-5'}`}>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg transition-transform group-hover:scale-110">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-foreground">
              English<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 text-sm font-bold transition-all hover:text-blue-500 ${pathname === link.href ? 'text-blue-600' : 'text-muted-foreground'}`}
                >
                  <link.icon className="h-4 w-4" />
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                 <Link
                    href="/admin"
                    className={`flex items-center gap-2 text-sm font-bold transition-all hover:text-blue-500 ${pathname.startsWith('/admin') ? 'text-blue-600' : 'text-muted-foreground'}`}
                 >
                    <Settings className="h-4 w-4" />
                    Admin
                 </Link>
              )}
            </div>

            <div className="h-6 w-px bg-border/50" />

            <div className="flex items-center gap-4">
              {session && <NotificationBell />}
              <ThemeToggle />
              
              {/* Language Switcher */}
               <button 
                  onClick={() => {
                     const nextLocale = locale === 'en' ? 'vi' : 'en';
                     router.replace(pathname, { locale: nextLocale });
                  }}
                  className="flex h-9 w-12 items-center justify-center rounded-xl bg-muted border border-border text-[10px] font-black uppercase tracking-tighter hover:border-blue-500/50 transition-all font-mono"
               >
                  {locale === 'en' ? 'VN' : 'EN'}
               </button>
              
              {session ? (
                <div className="relative group">
                   <button className="flex items-center gap-2 rounded-xl bg-card border border-border p-1 pr-3 transition-all hover:border-blue-500/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-black">
                         {session.user?.name?.[0] || 'U'}
                      </div>
                      <span className="text-sm font-bold text-foreground max-w-[100px] truncate">{session.user?.name}</span>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                   </button>
                   
                   {/* Dropdown */}
                   <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-card border border-border p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                      <div className="px-4 py-3 border-b border-border/50 mb-2">
                         <p className="text-xs font-bold text-muted-foreground uppercase">{isAdmin ? 'Admin' : 'Student'}</p>
                      </div>
                      <button 
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all"
                      >
                         <LogOut className="h-4 w-4" />
                         {t('nav.sign_out')}
                      </button>
                   </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="rounded-2xl bg-foreground px-6 py-2.5 text-sm font-bold text-background transition-all hover:opacity-90 active:scale-95 shadow-xl shadow-foreground/5"
                >
                  {t('nav.sign_in')}
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-4">
             {session && <NotificationBell />}
             <ThemeToggle />
             <button 
                  onClick={() => {
                     const nextLocale = locale === 'en' ? 'vi' : 'en';
                     router.replace(pathname, { locale: nextLocale });
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted border border-border text-[10px] font-black uppercase font-mono"
               >
                  {locale === 'en' ? 'VN' : 'EN'}
               </button>
             <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-muted-foreground">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border p-6 space-y-4 shadow-2xl animate-in slide-in-from-top duration-300">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${pathname === link.href ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'}`}
            >
              <link.icon className="h-5 w-5" />
              {link.name}
            </Link>
          ))}
          {isAdmin && (
             <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 p-4 rounded-2xl font-bold ${pathname.startsWith('/admin') ? 'bg-blue-600 text-white' : 'bg-muted text-foreground'}`}
             >
                <Settings className="h-5 w-5" />
                Admin Panel
             </Link>
          )}
          {session ? (
            <button 
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 text-red-500 font-bold"
            >
               <LogOut className="h-5 w-5" />
               Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-foreground text-background font-bold shadow-xl"
            >
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
