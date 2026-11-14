"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Role-based redirection
      if (data.role === "ADMIN") {
        router.push("/admin");
      } else if (data.role === "FACULTY") {
        router.push("/faculty");
      } else if (data.role === "STUDENT") {
        router.push("/student");
      } else {
        router.push("/");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf9f8] px-4 py-8 text-stone-900">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Header Branding */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#831825] text-amber-300 shadow-xs border border-[#9b1c2e]">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-stone-950">
            Shri Ram Group of Colleges
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Examination and Result Management System
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
          <div className="mb-4 border-b border-stone-100 pb-3">
            <h2 className="text-sm font-semibold text-stone-900">Sign in to your account</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Enter your Roll Number, Faculty ID, or Admin Email.
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-stone-700">
                Institutional Identifier
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Roll No, Faculty ID, or Email"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#831825] focus:outline-none focus:ring-1 focus:ring-[#831825]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your account password"
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#831825] focus:outline-none focus:ring-1 focus:ring-[#831825]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#831825] px-4 py-2.5 text-xs font-medium text-white shadow-xs transition hover:bg-[#6d1521] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#831825]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-amber-300" />
                  <span>Sign in</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quiet institutional notice */}
        <p className="mt-4 text-center text-[11px] text-stone-400">
          Authorized institutional access only • SRGC Examination Division
        </p>
      </div>
    </div>
  );
}
