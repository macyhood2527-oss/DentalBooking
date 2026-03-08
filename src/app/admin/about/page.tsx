"use client";

import { FormEvent, useEffect, useState } from "react";
import AdminSubnav from "../../../components/AdminSubnav";
import AdminToast from "../../../components/AdminToast";
import { supabase } from "../../../lib/supabase";

const defaultTitle = "About BrightSmile Dental Clinic";
const defaultContent =
  "At BrightSmile Dental Clinic, we focus on preventive and restorative care with a calm, patient-first experience. Our team combines modern techniques with a friendly approach so every visit feels clear, comfortable, and personalized.";
const CONTENT_MAX_LENGTH = 2000;

export default function AdminAboutPage() {
  const [title, setTitle] = useState(defaultTitle);
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    async function loadAbout() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("homepage_about")
        .select("id, title, content")
        .eq("id", 1)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setTitle(data.title?.trim() || defaultTitle);
        setContent((data.content?.trim() || defaultContent).slice(0, CONTENT_MAX_LENGTH));
      }

      setLoading(false);
    }

    loadAbout();
    return undefined;
  }, []);

  useEffect(() => {
    if (!toastMessage) return undefined;
    const timeout = window.setTimeout(() => setToastMessage(""), 2500);
    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setToastMessage("");

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle) {
      setErrorMessage("Title is required.");
      return;
    }

    if (!trimmedContent) {
      setErrorMessage("Content is required.");
      return;
    }
    if (trimmedContent.length > CONTENT_MAX_LENGTH) {
      setErrorMessage(`Content must be ${CONTENT_MAX_LENGTH} characters or less.`);
      return;
    }

    setSaving(true);

    const { error } = await supabase.from("homepage_about").upsert(
      {
        id: 1,
        title: trimmedTitle,
        content: trimmedContent,
      },
      { onConflict: "id" }
    );

    if (error) {
      setErrorMessage(error.message);
      setSaving(false);
      return;
    }

    setTitle(trimmedTitle);
    setContent(trimmedContent);
    setToastMessage("About Us content saved.");
    setSaving(false);
  }

  return (
    <main className="relative overflow-hidden pb-14">
      <div className="absolute inset-0 -z-10 shell-bg" />

      <div className="mx-auto max-w-7xl px-6 py-10">
        <AdminToast message={toastMessage} onClose={() => setToastMessage("")} />
        <section className="mb-8 glass-card rounded-[30px] border border-[var(--border)] p-7 sm:p-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
            BrightSmile Admin
          </div>
          <h1 className="text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
            Homepage About Us
          </h1>
          <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[var(--muted)]">
            Edit the About Us section shown on the homepage.
          </p>
        </section>
        <AdminSubnav />

        {loading ? (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-sm">
            <p className="text-[var(--muted)]">Loading About Us content...</p>
          </section>
        ) : (
          <section className="rounded-[26px] border border-[var(--border)] bg-white p-6 shadow-[0_18px_45px_rgba(20,184,166,0.08)] sm:p-7">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="about-title" className="mb-1.5 block text-sm font-medium">
                  Title
                </label>
                <input
                  id="about-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-white p-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                  required
                />
              </div>

              <div>
                <label htmlFor="about-content" className="mb-1.5 block text-sm font-medium">
                  Content
                </label>
                <textarea
                  id="about-content"
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX_LENGTH))}
                  className="min-h-[180px] w-full resize-y rounded-xl border border-[var(--border)] bg-white p-3 leading-7 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[#99f6e4]"
                  required
                />
                <p className="mt-1 text-right text-xs text-[var(--muted)]">
                  {content.length} / {CONTENT_MAX_LENGTH} characters
                </p>
              </div>

              <div>
                <p className="mb-1.5 block text-sm font-medium">Live Preview</p>
                <div className="glass-card rounded-2xl border border-[var(--border)] p-5 sm:p-6">
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-[var(--primary-dark)]">
                    About Us
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-[var(--foreground)]">
                    {title.trim() || "Untitled section"}
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-[15px] leading-7 text-[var(--muted)]">
                    {content.trim() || "Your About Us content preview will appear here."}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--primary-dark)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save About Us"}
              </button>
            </form>

            {errorMessage && (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
