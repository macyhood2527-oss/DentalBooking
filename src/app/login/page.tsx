"use client";

import Link from "next/link";
import { useState } from "react";
import { isAdminUser } from "../../lib/admin";
import { signIn } from "../../lib/auth";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await signIn(email, password);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const admin = await isAdminUser(user);

    window.location.href = admin ? "/admin" : "/appointments";
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="glass-card w-full max-w-md rounded-2xl border border-[var(--border)] p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-[var(--primary-dark)]">Welcome Back</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Log in to manage your appointments.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="glass-input w-full rounded-xl border border-[var(--border)] p-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="glass-input w-full rounded-xl border border-[var(--border)] p-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[var(--accent)] p-3 font-medium text-white hover:bg-[var(--primary)] disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-[var(--muted)]">{message}</p>}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-[var(--primary-dark)]">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
