"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

type AboutRow = {
  title: string | null;
  content: string | null;
};

const defaultAbout = {
  title: "About BrightSmile Dental Clinic",
  content:
    "At BrightSmile Dental Clinic, we focus on preventive and restorative care with a calm, patient-first experience. Our team combines modern techniques with a friendly approach so every visit feels clear, comfortable, and personalized.",
};

export default function AboutPage() {
  const [about, setAbout] = useState(defaultAbout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAbout() {
      setLoading(true);
      const { data, error } = await supabase
        .from("homepage_about")
        .select("title, content")
        .eq("id", 1)
        .maybeSingle();

      if (!error && data) {
        const row = data as AboutRow;
        setAbout({
          title: row.title?.trim() || defaultAbout.title,
          content: row.content?.trim() || defaultAbout.content,
        });
      }

      setLoading(false);
    }

    loadAbout();
    return undefined;
  }, []);

  return (
    <main className="pb-16">
      <section className="shell-bg">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <div className="glass-card rounded-[28px] border border-[var(--border)] p-8 sm:p-10">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
              About Us
            </p>
            <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
              {about.title}
            </h1>
            {loading ? (
              <p className="mt-4 text-[15px] leading-7 text-[var(--muted)]">
                Loading clinic information...
              </p>
            ) : (
              <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[var(--muted)]">
                {about.content}
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
