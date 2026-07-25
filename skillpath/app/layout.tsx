import type { Metadata } from "next";
import { Inter, Irish_Grover } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "SkillPath",
  description: "Identify the exact skill gap for your target role and close it with a customized learning plan.",
};

import { SmoothScrolling } from "@/components/ui/SmoothScrolling";
import { Navbar } from "@/components/landing/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import { AuthModal } from "@/components/ui/auth-modal";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Preloader } from "@/components/ui/Preloader";
import { UIProvider, useUI } from "@/context/UIContext";
import { AppWrapper } from "@/components/ui/AppWrapper";
import { ThemeTransition } from "@/components/providers/theme-transition";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${irishGrover.variable} antialiased`} suppressHydrationWarning>
      <body className="font-sans flex flex-col min-h-screen bg-canvas text-ink selection:bg-brand-pink selection:text-white">
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
