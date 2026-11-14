"use client";

import { useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle2 } from "lucide-react";

interface InstitutionSettingsData {
  id?: string;
  institutionName: string;
  institutionCode: string;
  tagline?: string | null;
  address?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  currentAcademicSession: string;
  allowStudentRankView: boolean;
  defaultPassingPercentage?: number | null;
}

export default function InstitutionSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<InstitutionSettingsData>({
    institutionName: "Shri Ram Group of Colleges",
    institutionCode: "SRGC",
    tagline: "Excellence in Technical & Professional Education",
    address: "Parikshitgarh Road, Muzaffarnagar, Uttar Pradesh",
    contactEmail: "admin@srgc.edu.in",
    contactPhone: "+91-131-2661000",
    websiteUrl: "https://www.srgc.edu.in",
    currentAcademicSession: "2025-2026",
    allowStudentRankView: false,
    defaultPassingPercentage: 40,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/admin/institution");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load institution settings");
        }
        setForm({
          institutionName: data.institutionName || "Shri Ram Group of Colleges",
          institutionCode: data.institutionCode || "SRGC",
          tagline: data.tagline || "",
          address: data.address || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          websiteUrl: data.websiteUrl || "",
          currentAcademicSession: data.currentAcademicSession || "2025-2026",
          allowStudentRankView: !!data.allowStudentRankView,
          defaultPassingPercentage: data.defaultPassingPercentage ?? 40,
        });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error loading settings");
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/admin/institution", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSuccess("Institutional settings and academic session successfully updated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5 text-stone-900 max-w-full overflow-x-hidden">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
          Institution Settings and Configuration
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure Shri Ram Group of Colleges branding, current academic session, and student rank visibility policies.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-4 text-xs text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/50 p-6">
          <h2 className="text-base font-bold text-slate-900">Institutional Identity & Branding</h2>
          <p className="text-xs text-slate-500">
            Official details rendered on official transcripts, grade cards, and PDF exports.
          </p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Institution Name</label>
              <input
                type="text"
                required
                value={form.institutionName}
                onChange={(e) => setForm({ ...form, institutionName: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Institution Code</label>
              <input
                type="text"
                required
                value={form.institutionCode}
                onChange={(e) => setForm({ ...form, institutionCode: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Tagline / Motto</label>
            <input
              type="text"
              value={form.tagline || ""}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Campus Address</label>
            <textarea
              rows={2}
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-700">Contact Email</label>
              <input
                type="email"
                value={form.contactEmail || ""}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Contact Phone</label>
              <input
                type="text"
                value={form.contactPhone || ""}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Website URL</label>
              <input
                type="url"
                value={form.websiteUrl || ""}
                onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-sm font-semibold text-slate-900">Academic Sessions and Privacy Policy</h2>
            <p className="text-xs text-slate-500">
              Control academic parameters and student result confidentiality.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700">Current Academic Session</label>
              <input
                type="text"
                required
                value={form.currentAcademicSession}
                onChange={(e) => setForm({ ...form, currentAcademicSession: e.target.value })}
                placeholder="2025-2026"
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Default Passing Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.defaultPassingPercentage ?? 40}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultPassingPercentage: parseFloat(e.target.value) || 40,
                  })
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* Privacy Toggle */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowStudentRankView}
                onChange={(e) => setForm({ ...form, allowStudentRankView: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-[#831825] focus:ring-slate-800"
              />
              <div>
                <span className="text-xs font-medium text-slate-900">
                  Allow Students to View Batch / Class Rank
                </span>
                <p className="mt-0.5 text-xs text-slate-500">
                  When enabled, students can see their class rank on their result dashboard and PDF grade cards. When disabled, rank is withheld to ensure confidentiality.
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-lg bg-[#831825] px-5 py-2 text-xs font-medium text-white shadow-2xs transition hover:bg-[#6d1521] disabled:opacity-50"
          >
            <Save className="h-4 w-4 text-amber-400" />
            <span>{saving ? "Saving Changes..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
