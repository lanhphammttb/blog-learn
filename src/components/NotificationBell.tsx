'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Clock, ScrollText, Trophy, Settings } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'achievement' | 'boss_review' | 'system';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id?: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(id ? { notificationId: id } : { all: true })
      });
      if (id) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (e) {}
  };

  const getIcon = (type: string) => {
    if (type === 'achievement') return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (type === 'boss_review') return <ScrollText className="h-4 w-4 text-blue-500" />;
    return <Settings className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl hover:bg-muted transition-all active:scale-95"
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-black text-white flex items-center justify-center ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-[320px] sm:w-[380px] rounded-[32px] border border-border bg-card shadow-2xl z-[70] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-muted/20">
              <h3 className="font-black text-sm uppercase tracking-widest text-foreground">Thông báo</h3>
              {unreadCount > 0 && (
                <button 
                  onClick={() => markRead()}
                  className="text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Đánh dấu tất cả đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">Bạn chưa có thông báo nào.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n._id}
                    className={`p-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-all cursor-pointer ${!n.isRead ? 'bg-blue-500/5' : ''}`}
                    onClick={() => {
                      if (!n.isRead) markRead(n._id);
                      if (n.link) window.location.href = n.link;
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-blue-500/10' : 'bg-muted'}`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm leading-tight mb-1 ${!n.isRead ? 'font-bold' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{n.message}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      {!n.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-muted/10 text-center">
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Học tập mỗi ngày cùng EnglishHub</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
