import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScrolling } from "@/components/ui/SmoothScrolling";
import { Navbar } from "@/components/landing/Navbar";
import { FloatingDock } from "@/components/ui/FloatingDock";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Preloader } from "@/components/ui/Preloader";
import { UIProvider } from "@/context/UIContext";
import { AppWrapper } from "@/components/ui/AppWrapper";
import { ThemeTransition } from "@/components/providers/theme-transition";
import { cn } from "@/lib/utils";
import { DraftProvider } from "@/context/DraftContext";

import { SmoothCursor } from "@/components/ui/smooth-cursor";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: "SkillPath",
  description: "Identify the exact skill gap for your target role and close it with a customized learning plan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("antialiased", "font-sans", geist.variable, geistMono.variable)} suppressHydrationWarning>
      <body className="font-sans flex flex-col min-h-screen bg-canvas text-ink selection:bg-brand-pink selection:text-white">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <DraftProvider>
              <UIProvider>
                <ThemeTransition>
                  <SmoothCursor />
                  <Preloader />
                  <AppWrapper>
                    <Navbar />
                    <FloatingDock />
                    <AuthModal />
                    <SmoothScrolling>
                      {children}
                    </SmoothScrolling>
                  </AppWrapper>
                </ThemeTransition>
              </UIProvider>
            </DraftProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
