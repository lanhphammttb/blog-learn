import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import AchievementToast from "@/components/dashboard/AchievementToast";
import ScrollToTop from "@/components/ScrollToTop";
import GlobalNoteWidget from "@/components/GlobalNoteWidget";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily English Knowledge - Master English Every Day",
  description: "A personal platform for learning and storing English materials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body 
        className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <ToastProvider>
              <Navbar />
              <AchievementToast />
            <GlobalNoteWidget />
            <ScrollToTop />
            <main className="flex-grow fixed-nav-padding">{children}</main>
            <footer className="border-t border-border py-12 mt-12">
              <div className="mx-auto max-w-7xl px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-black text-foreground mb-3">
                      English<span className="text-blue-600">Hub</span>
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      A personal platform for learning and mastering English through structured roadmaps and interactive lessons.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Navigate</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li><a href="/" className="hover:text-blue-500 transition-colors">Home</a></li>
                      <li><a href="/roadmaps" className="hover:text-blue-500 transition-colors">Roadmaps</a></li>
                      <li><a href="/community" className="hover:text-blue-500 transition-colors">Community</a></li>
                      <li><a href="/dashboard" className="hover:text-blue-500 transition-colors">Dashboard</a></li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">Features</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>Interactive Lessons</li>
                      <li>Learning Roadmaps</li>
                      <li>Progress Tracking</li>
                      <li>Community Leaderboard</li>
                    </ul>
                  </div>
                </div>
                <div className="border-t border-border pt-6 text-center text-sm text-muted-foreground">
                  <p>&copy; {new Date().getFullYear()} Daily English Knowledge Blog. Built for learning.</p>
                </div>
              </div>
            </footer>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
