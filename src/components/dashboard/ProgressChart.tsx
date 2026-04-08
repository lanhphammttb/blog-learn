'use client';

import { TrendingUp, Award } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface XpDay {
  date: string;
  xp: number;
}

interface Props {
  data: XpDay[];
}

export default function ProgressChart({ data }: Props) {
  const t = useTranslations('Dashboard.chart');
  const locale = useLocale();

  // Fill missing days for the last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const found = data.find(item => item.date === dateStr);
    return {
      date: dateStr,
      xp: found ? found.xp : 0,
      label: d.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short' })
    };
  });

  const maxXP = Math.max(...last7Days.map(d => d.xp), 50); // Min scale 50

  return (
    <div className="rounded-[32px] border border-border bg-card p-8 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground uppercase tracking-tight flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {t('title')}
          </h2>
          <p className="text-xs text-muted-foreground font-medium mt-1">{t('desc')}</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 text-xs font-bold self-start md:self-auto">
           <Award className="h-4 w-4" /> Mastery
        </div>
      </div>

      <div className="h-48 w-full flex items-end justify-between gap-1 md:gap-2 px-1 md:px-2">
         {last7Days.map((day, i) => {
           const height = (day.xp / maxXP) * 100;
           return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-3 group">
                 <div className="relative w-full flex flex-col items-center justify-end h-full">
                    {/* Tooltip */}
                    <div className="absolute -top-8 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                       +{day.xp} XP
                    </div>
                    
                    {/* Bar */}
                    <div 
                      className={`w-full max-w-[32px] rounded-t-xl transition-all duration-1000 ease-out border-b-2 border-blue-700/20 ${day.xp > 0 ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-muted/30'}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                 </div>
                 <span suppressHydrationWarning className={`text-[10px] font-bold uppercase tracking-tighter ${i === 6 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                    {day.label}
                 </span>
              </div>
           );
         })}
      </div>

      <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
         <div className="flex gap-4">
            <div className="flex items-center gap-1.5">
               <div className="h-3 w-3 rounded-full bg-blue-500" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('learning')}</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="h-3 w-3 rounded-full bg-muted" />
               <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('resting')}</span>
            </div>
         </div>
         <p className="text-[10px] font-bold text-muted-foreground italic">{t('auto_update')}</p>
      </div>
    </div>
  );
}
