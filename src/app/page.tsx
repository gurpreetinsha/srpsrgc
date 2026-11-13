import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-[#991b1b] text-xl font-bold text-white shadow ring-4 ring-red-100">
            SR
          </div>
          <h1 className="text-2xl font-bold text-[#991b1b]">
            Shri Ram Group of Colleges
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Student Result Management System
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/login"
            className="flex w-full items-center justify-center rounded-lg bg-[#991b1b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7f1d1d] shadow"
          >
            Sign In to Portal
          </Link>
          <div className="text-center">
            <span className="text-xs text-slate-400">
              Authorized access for Students, Faculty, and Institutional Administrators
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

