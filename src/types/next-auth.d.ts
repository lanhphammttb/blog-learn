import NextAuth, { DefaultSession } from 'next-auth';
import { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'admin' | 'reader';
      providerId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: 'admin' | 'reader';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: 'admin' | 'reader';
    id?: string;
    providerId?: string;
  }
}
