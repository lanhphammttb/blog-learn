export interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
}

export const ALL_BADGES: Badge[] = [
  { id: 'early-bird', name: 'Early Bird', icon: '🐣', color: 'bg-green-500/10 text-green-500', desc: 'Finished your first lesson' },
  { id: 'fire-starter', name: 'Fire Starter', icon: '🔥', color: 'bg-orange-500/10 text-orange-500', desc: '3-Day learning streak' },
  { id: 'fast-learner', name: 'Fast Learner', icon: '⚡', color: 'bg-blue-500/10 text-blue-500', desc: '5 Lessons completed' },
  { id: 'grammar-guru', name: 'Grammar Guru', icon: '🧠', color: 'bg-purple-500/10 text-purple-500', desc: '10 Lessons completed' },
  { id: 'vocab-master', name: 'Vocab Master', icon: '📚', color: 'bg-yellow-500/10 text-yellow-600', desc: 'Saved 10 Flashcards' },
  { id: 'scholar', name: 'Scholar', icon: '🦉', color: 'bg-indigo-500/10 text-indigo-500', desc: '20 Lessons completed' }
];

export function getUserBadges(
  totalLessons: number, 
  streakCount: number, 
  vocabCount: number = 0
): { unlocked: Badge[], locked: Badge[] } {
  const unlockedIds = new Set<string>();

  if (totalLessons >= 1) unlockedIds.add('early-bird');
  if (totalLessons >= 5) unlockedIds.add('fast-learner');
  if (totalLessons >= 10) unlockedIds.add('grammar-guru');
  if (totalLessons >= 20) unlockedIds.add('scholar');
  
  if (streakCount >= 3) unlockedIds.add('fire-starter');
  if (vocabCount >= 10) unlockedIds.add('vocab-master');

  const unlocked = ALL_BADGES.filter(b => unlockedIds.has(b.id));
  const locked = ALL_BADGES.filter(b => !unlockedIds.has(b.id));

  return { unlocked, locked };
}

export function calculateStreak(progressRecords: any[]): number {
  const dates = progressRecords
    .map(p => p.lastUpdated || p.lastActive)
    .filter(Boolean)
    .map(d => {
      const dt = new Date(d);
      dt.setHours(0, 0, 0, 0);
      return dt.getTime();
    });

  if (dates.length === 0) return 0;

  const uniqueDays = [...new Set(dates)].sort((a, b) => b - a);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  const oneDay = 86400000;

  if (uniqueDays[0] < todayMs - oneDay) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i - 1] - uniqueDays[i] === oneDay) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
