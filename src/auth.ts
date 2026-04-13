import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';

const providers = [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  // GitHub provider only enabled when credentials are configured
  ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ? [
        GitHub({
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        }),
      ]
    : []),
  Credentials({
    name: 'Admin Access',
    credentials: {
      password: { label: 'Admin Password', type: 'password' },
    },
    async authorize(credentials) {
      const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      const submitted = credentials?.password as string | undefined;

      if (!adminPasswordHash || !submitted) return null;

      const isValid = await bcrypt.compare(submitted, adminPasswordHash);
      if (isValid) {
        return { id: 'admin', name: 'Admin', role: 'admin' };
      }
      return null;
    },
  }),
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? 'reader';
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as 'admin' | 'reader') ?? 'reader';
        session.user.id = (token.email ?? token.id ?? token.sub) as string;
        session.user.providerId = token.sub;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const role = auth?.user?.role;
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      if (isOnAdmin) {
        return isLoggedIn && role === 'admin';
      }

      return true;
    },
  },
});
