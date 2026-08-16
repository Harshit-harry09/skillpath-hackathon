'use client';

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const SignInPage = dynamic(
  () => import("@/components/ui/sign-in-flow-1").then((mod) => mod.SignInPage),
  {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-canvas animate-pulse" />,
  }
);

export default function AuthPage() {
  const router = useRouter();
  
  return (
    <main className="h-screen w-full bg-canvas overflow-hidden">
      <SignInPage onSuccess={() => router.push('/profile')} />
    </main>
  );
}
