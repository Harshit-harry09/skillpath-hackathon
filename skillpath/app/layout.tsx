import type { Metadata } from "next";
import { Inter, Irish_Grover, Geist } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap"
});

const irishGrover = Irish_Grover({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-irish-grover",
  display: "swap"
});

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
    <html lang="en" className={cn("antialiased", inter.variable, irishGrover.variable, "font-sans", geist.variable)} suppressHydrationWarning>
      <body className="font-sans flex flex-col min-h-screen bg-canvas text-ink selection:bg-brand-pink selection:text-white pb-20">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <UIProvider>
              <ThemeTransition>
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
