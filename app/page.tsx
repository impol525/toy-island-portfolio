"use client";

// In Next.js 15+, `ssr: false` is only allowed inside a Client Component,
// which is why this page carries the "use client" directive.
import dynamic from "next/dynamic";

const ToyIslandWorld = dynamic(() => import("@/components/ToyIslandWorld"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-sky-200">
      <p className="rounded-2xl border-4 border-slate-900 bg-amber-50 px-6 py-3 text-lg font-black text-slate-900 shadow-[4px_4px_0_#0f172a]">
        Warming up the engine...
      </p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="fixed inset-0 h-dvh w-screen overflow-hidden">
      <ToyIslandWorld />
    </main>
  );
}