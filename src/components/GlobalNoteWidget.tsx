'use client';

import { useSession } from 'next-auth/react';
import QuickNote from '@/components/QuickNote';

export default function GlobalNoteWidget() {
  const { data: session, status } = useSession();

  if (status === 'loading' || !session) return null;

  return <QuickNote isLoggedIn={true} />;
}
