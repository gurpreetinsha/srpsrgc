"use client";

import { useEffect, useState } from "react";
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";

export default function AuditLogsAdminPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async (p = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", p.toString());
      params.append("pageSize", "20");
      if (actionFilter) params.append("action", actionFilter);
      if (entityFilter) params.append("entityType", entityFilter);

      const res = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load audit logs");

      setLogs(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading audit records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs(1);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes("PUBLISH") && !action.includes("UNPUBLISH")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (action.includes("UNPUBLISH") || action.includes("REJECT") || action.includes("DELETE")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (action.includes("CORRECT") || action.includes("UPDATE")) {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (action.includes("LOGIN") || action.includes("AUTH")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    return "bg-slate-100 text-slate-800 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-950">
          Audit Trail and System History
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Immutable institutional audit logs tracking logins, marks submissions, corrections, publications, and administrative alterations.
        </p>
      </div>

      {/* Filters Form */}
      <form
        onSubmit={handleFilterSubmit}
        className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-700">Filters:</span>
        </div>

        <div className="flex-1 sm:flex-none">
          <input
            type="text"
            placeholder="Filter Action (e.g. PUBLISH)"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <div className="flex-1 sm:flex-none">
          <input
            type="text"
            placeholder="Entity Type (e.g. Mark)"
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full sm:w-48 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-800 focus:border-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-800"
          />
        </div>

        <button
          type="submit"
          className="rounded-lg bg-[#831825] px-4 py-1.5 text-xs font-medium text-white shadow-2xs hover:bg-[#6d1521]"
        >
          Apply Filter
        </button>

        {(actionFilter || entityFilter) && (
          <button
            type="button"
            onClick={() => {
              setActionFilter("");
              setEntityFilter("");
              setPage(1);
              fetchLogs(1);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 text-center py-1 sm:py-0"
          >
            Clear Filters
          </button>
        )}
      </form>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-4 text-xs text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-2xs">
          <History className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-800">No audit events recorded</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500">
            System actions matching the specified filter criteria have not yet occurred.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-medium">
                <tr>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Actor Identifier</th>
                  <th className="px-4 py-3 font-medium">IP Address</th>
                  <th className="px-4 py-3 font-medium text-center">Changes / Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const hasDetails = log.newValues || log.oldValues;

                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {log.entityType}
                      {log.entityId && (
                        <span className="block text-[10px] font-mono text-slate-400">
                          {log.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-800">
                      <div className="font-semibold">{log.user?.identifier || "System"}</div>
                      <div className="text-[10px] text-slate-400">{log.user?.role || "SYSTEM"}</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                      {log.ipAddress || "Internal"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {hasDetails ? (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          <span>{isExpanded ? "Hide" : "Inspect"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {/* Expanded Drawer for Details */}
          {expandedLogId && (
            <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
              {(() => {
                const log = logs.find((l) => l.id === expandedLogId);
                if (!log) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800">
                        Detailed Audit Snapshot for Event: {log.action}
                      </h4>
                      <button
                        onClick={() => setExpandedLogId(null)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      {log.oldValues && (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Prior State (Old Values)
                          </div>
                          <pre className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-[11px] font-mono text-slate-800">
                            {JSON.stringify(log.oldValues, null, 2)}
                          </pre>
                        </div>
                      )}

                      {log.newValues && (
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Resulting State (New Values)
                          </div>
                          <pre className="max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-[11px] font-mono text-slate-800">
                            {JSON.stringify(log.newValues, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <div>
              Showing page {page} of {totalPages} ({total} total audit records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded border border-slate-300 bg-white p-1 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded border border-slate-300 bg-white p-1 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
