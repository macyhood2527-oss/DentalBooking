"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAdminUser } from "../lib/admin";
import { signOut } from "../lib/auth";
import { supabase } from "../lib/supabase";

type UserInfo = {
  email?: string;
  isAdmin: boolean;
} | null;

export default function Navbar() {
  const [user, setUser] = useState<UserInfo>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUser(null);
      return;
    }

    const admin = await isAdminUser(user);
    setUser({ email: user.email, isAdmin: admin });
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await signOut();
    window.location.href = "/login";
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/book", label: "Book" },
    { href: "/appointments", label: "Appointments" },
    { href: "/about", label: "About Us" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/55 shadow-sm backdrop-blur-md">
      <nav className="mx-auto max-w-6xl px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent)] text-lg text-white shadow-sm">
            🦷
          </div>
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">BrightSmile</p>
            <p className="text-xs text-[var(--muted)]">Dental Clinic</p>
          </div>
        </Link>

          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--primary-dark)]"
              >
                {link.label}
              </Link>
            ))}
            {user?.isAdmin && (
              <Link
                href="/admin"
                className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--primary-dark)]"
              >
                Admin
              </Link>
            )}

            {user ? (
              <>
                <span className="hidden max-w-[180px] truncate text-sm text-[var(--muted)] lg:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary)]"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="glass-soft rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--card)]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[var(--primary)]"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            className="glass-soft rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--card)] md:hidden"
          >
            Menu
          </button>
        </div>

        {mobileOpen && (
          <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm md:hidden">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--primary-dark)]"
                >
                  {link.label}
                </Link>
              ))}
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--background)] hover:text-[var(--primary-dark)]"
                >
                  Admin
                </Link>
              )}
            </div>

            <div className="mt-3 border-t border-[var(--border)] pt-3">
              {user ? (
                <div className="space-y-2">
                  <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--primary)]"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="glass-soft rounded-xl border border-[var(--border)] px-4 py-2 text-center text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--card)]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-[var(--accent)] px-4 py-2 text-center text-sm font-medium text-white shadow-sm transition hover:bg-[var(--primary)]"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
