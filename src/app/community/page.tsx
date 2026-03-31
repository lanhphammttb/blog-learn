'use client';

import { useState, useEffect } from 'react';
import { 
  Trophy, Users, Target, Shield, 
  Crown, Medal, ArrowUpRight, Search, 
  Sparkles, Flame
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface LeaderboardUser {
  id: string;
  name: string;
  image: string | null;
  totalLessons: number;
  totalRoadmaps: number;
  totalXP: number;
  rank: number;
}

export default function CommunityPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/community/leaderboard');
        const data = await res.json();
        if (Array.isArray(data)) {
          setUsers(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-16 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600/10 text-blue-600 shadow-inner">
            <Trophy className="h-10 w-10 animate-bounce" />
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl mb-4">
             Community <span className="text-blue-600">Leaderboard</span>
          </h1>
          <p className="text-xl text-muted-foreground mx-auto max-w-2xl px-6">
            Celebrate our top learners and find inspiration for your own English journey.
          </p>
        </header>

        {/* Highlight Section (Top 3) */}
        {!loading && users.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* 2nd Place */}
            <div className="order-2 md:order-1 pt-12">
               <div className="relative rounded-3xl bg-card border border-border p-8 text-center shadow-xl flex flex-col items-center group transition-all hover:-translate-y-2">
                  <div className="absolute -top-6 h-12 w-12 rounded-2xl bg-zinc-400 text-white flex items-center justify-center font-black shadow-lg">
                    <Medal className="h-6 w-6" />
                  </div>
                  <div className="h-20 w-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mb-4 font-black text-muted-foreground">
                    {users[1].image ? <Image src={users[1].image} alt={users[1].name} width={80} height={80} className="h-full w-full rounded-2xl object-cover" /> : users[1].name[0]}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate w-full">{users[1].name}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    {users[1].totalXP} XP
                  </div>
               </div>
            </div>

            {/* 1st Place */}
            <div className="order-1 md:order-2">
               <div className="relative rounded-3xl bg-blue-600 p-10 text-center text-white shadow-2xl shadow-blue-500/20 flex flex-col items-center group transition-all hover:-translate-y-2 scale-105">
                  <div className="absolute -top-8 h-16 w-16 rounded-2xl bg-yellow-400 text-zinc-900 flex items-center justify-center font-black shadow-xl ring-4 ring-blue-600 animate-pulse">
                    <Crown className="h-8 w-8" />
                  </div>
                  <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl mb-6 font-black ring-4 ring-white/10">
                    {users[0].image ? <Image src={users[0].image} alt={users[0].name} width={96} height={96} className="h-full w-full rounded-3xl object-cover" /> : users[0].name[0]}
                  </div>
                  <h3 className="font-black text-2xl mb-2 truncate w-full">{users[0].name}</h3>
                  <div className="flex items-center gap-2 text-blue-100 font-bold text-lg">
                    <Sparkles className="h-5 w-5 text-yellow-300" />
                    {users[0].totalXP} XP
                  </div>
                  <div className="mt-4 text-xs font-bold uppercase tracking-widest text-blue-200">The Ultimate Learner</div>
               </div>
            </div>

            {/* 3rd Place */}
            <div className="order-3 pt-12">
               <div className="relative rounded-3xl bg-card border border-border p-8 text-center shadow-xl flex flex-col items-center group transition-all hover:-translate-y-2">
                  <div className="absolute -top-6 h-12 w-12 rounded-2xl bg-amber-700 text-white flex items-center justify-center font-black shadow-lg">
                    <Medal className="h-6 w-6" />
                  </div>
                  <div className="h-20 w-20 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-3xl mb-4 font-black text-muted-foreground">
                    {users[2].image ? <Image src={users[2].image} alt={users[2].name} width={80} height={80} className="h-full w-full rounded-2xl object-cover" /> : users[2].name[0]}
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate w-full">{users[2].name}</h3>
                  <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm">
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                    {users[2].totalXP} XP
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* Global Rankings */}
        <div className="rounded-[40px] bg-card border border-border overflow-hidden shadow-2xl">
          <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
               <Users className="h-6 w-6 text-blue-600" />
               Global Rankings
             </h2>
             <div className="relative max-w-xs w-full">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <input 
                 type="text" 
                 placeholder="Search student..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full rounded-2xl border border-border bg-muted/30 py-3 pl-11 pr-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-blue-500/20"
               />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="px-8 py-5 text-sm font-bold text-muted-foreground uppercase tracking-widest w-24 text-center">Rank</th>
                  <th className="px-8 py-5 text-sm font-bold text-muted-foreground uppercase tracking-widest">Student</th>
                  <th className="px-8 py-5 text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">XP</th>
                  <th className="px-8 py-5 text-sm font-bold text-muted-foreground uppercase tracking-widest text-center">Lessons</th>
                  <th className="px-8 py-5 text-sm font-bold text-muted-foreground uppercase tracking-widest text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-10 h-20 bg-muted/10"></td>
                    </tr>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr key={user.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl font-black ${index < 3 ? 'bg-blue-600 text-white' : 'text-muted-foreground bg-muted/50'}`}>
                          #{index + 1}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-lg font-black text-muted-foreground shadow-sm">
                            {user.image ? <Image src={user.image} alt={user.name} width={48} height={48} className="h-full w-full rounded-xl object-cover" /> : user.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-foreground leading-none mb-1">{user.name}</p>
                            <p className="text-xs text-muted-foreground">Certified Learner</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="inline-flex items-center gap-1 font-black text-foreground">
                          {user.totalXP} XP
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="font-bold text-muted-foreground">{user.totalLessons}</span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link 
                           href={`/profile/${user.id}`}
                           className="inline-flex items-center gap-1 rounded-xl bg-blue-500/10 px-4 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-blue-600 hover:text-white group-hover:scale-105"
                        >
                           View <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-muted-foreground font-medium">No students found...</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
