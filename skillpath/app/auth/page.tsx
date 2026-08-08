'use client';

import { SignInPage } from "@/components/ui/sign-in-flow-1";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  
  return (
    <main className="h-screen w-full bg-canvas overflow-hidden">
      <SignInPage onSuccess={() => router.push('/profile')} />
    </main>
  );
}
