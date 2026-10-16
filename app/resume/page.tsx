import type { Metadata } from "next";
import Link from "next/link";
import { PORTFOLIO_DATA as d } from "@/data/portfolio";

export const metadata: Metadata = {
  title: `${d.name} | Resume`,
  description: `${d.role}. ${d.objective}`,
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="border-b-4 border-slate-900 pb-1 text-xl font-black text-slate-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ResumePage() {
  return (
    <main className="min-h-dvh bg-amber-50 px-4 py-8 text-slate-800 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex flex-wrap items-center gap-3 print:hidden">
          <Link
            href="/"
            className="rounded-xl border-4 border-slate-900 bg-white px-4 py-2 text-sm font-black text-slate-900 shadow-[3px_3px_0_#0f172a]"
          >
            Back to the island
          </Link>
          <a
            href={d.resumePdf}
            download
            className="rounded-xl border-4 border-slate-900 bg-orange-500 px-4 py-2 text-sm font-black text-white shadow-[3px_3px_0_#0f172a]"
          >
            Download PDF
          </a>
        </div>

        <header>
          <h1 className="text-4xl font-black leading-tight text-slate-900">{d.name}</h1>
          <p className="mt-1 text-lg font-semibold text-slate-600">{d.role}</p>
          <p className="mt-2 text-sm">
            {d.location} &nbsp;|&nbsp;{" "}
            <a className="underline underline-offset-4" href={`mailto:${d.email}`}>
              {d.email}
            </a>{" "}
            &nbsp;|&nbsp;{" "}
            <a className="underline underline-offset-4" href={d.github} target="_blank" rel="noopener noreferrer">
              {d.github.replace("https://", "")}
            </a>
          </p>
        </header>

        <Section title="Objective">
          <p className="leading-relaxed">{d.objective}</p>
        </Section>

        <Section title="Education">
          <p className="font-bold text-slate-900">{d.education.degree}</p>
          <p>{d.education.major}</p>
          <p>{d.education.school}</p>
        </Section>

        <Section title="Certification">
          <p>{d.certification}</p>
        </Section>

        <Section title="Projects">
          <div className="space-y-5">
            {d.projects.map((p) => (
              <article key={p.title} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-lg font-black text-slate-900">{p.title}</h3>
                  <span className="text-sm font-semibold text-slate-500">{p.period}</span>
                </div>
                <p className="text-sm font-semibold text-slate-600">{p.role}</p>
                <p className="mt-1 leading-relaxed">{p.desc}</p>
                <p className="mt-1 text-sm">
                  <span className="font-bold">Tech:</span> {p.tech.join(", ")}
                </p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Skills">
          <p className="leading-relaxed">{d.skills.join(", ")}</p>
        </Section>

        <Section title="Trainings and seminars">
          <ul className="list-disc space-y-1 pl-5">
            {d.trainings.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Section>
      </div>
    </main>
  );
}