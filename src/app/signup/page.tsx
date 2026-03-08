"use client";

import Link from "next/link";
import { useState } from "react";
import { signUp } from "../../lib/auth";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Signup successful! Check your email.");
      setFullName("");
      setEmail("");
      setPassword("");
    }

    setLoading(false);
  }

  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-6 py-10">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 border border-[var(--border)]">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-[var(--primary-dark)]">Create Account</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Book your dental appointments with ease.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              className="glass-input w-full rounded-xl border border-[var(--border)] p-3"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a password"
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
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        {message && <p className="mt-4 text-center text-sm text-[var(--muted)]">{message}</p>}

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[var(--primary-dark)]">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
