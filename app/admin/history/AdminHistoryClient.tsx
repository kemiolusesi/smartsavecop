'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Search } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { toErrorMessage } from '@/lib/error-message';

type ActivityLogRow = {
  id: string;
  created_at: string | null;
  action_type: string | null;
  target_user_email: string | null;
  target_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
};

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultFromDate() {
  const now = new Date();
  return toInputDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function getDefaultToDate() {
  return toInputDate(new Date());
}

function formatDate(value: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function formatReportDate(value: string) {
  if (!value) return 'Not set';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatGeneratedDate(value: Date) {
  return value.toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function humanizeAction(value: string | null) {
  if (!value) return 'Admin Action';
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function compactDetails(details: Record<string, unknown> | null) {
  if (!details) return 'No details';

  const entries = Object.entries(details)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 4);

  if (entries.length === 0) return 'No details';

  return entries.map(([key, value]) => `${humanizeAction(key)}: ${String(value)}`).join(' | ');
}

function isInDateRange(value: string | null, fromDate: string, toDate: string) {
  if (!value) return false;
  const createdAt = new Date(value).getTime();
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : Number.NEGATIVE_INFINITY;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;
  if (!Number.isFinite(createdAt)) return false;
  return createdAt >= from && createdAt <= to;
}

function isApproval(action: string | null) {
  const value = String(action || '').toLowerCase();
  return value.includes('approve') || value.includes('approved') || value.includes('activate');
}

function isRejection(action: string | null) {
  const value = String(action || '').toLowerCase();
  return value.includes('reject') || value.includes('rejected') || value.includes('deactivate');
}

function getReportRows(rows: ActivityLogRow[], fromDate: string, toDate: string, selectedAction: string) {
  return rows.filter((row) => {
    const matchesDate = isInDateRange(row.created_at, fromDate, toDate);
    const matchesAction = selectedAction === 'All' || row.action_type === selectedAction;
    return matchesDate && matchesAction;
  });
}

export default function AdminHistoryClient({
  rows: initialRows = [],
  adminEmail,
}: {
  rows?: ActivityLogRow[];
  adminEmail: string;
}) {
  const [rows, setRows] = useState<ActivityLogRow[]>(initialRows);
  const [loading, setLoading] = useState(initialRows.length === 0);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState('All');
  const [fromDate, setFromDate] = useState<string>(() => getDefaultFromDate());
  const [toDate, setToDate] = useState<string>(() => getDefaultToDate());
  const [printData, setPrintData] = useState<ActivityLogRow[]>([]);
  const [printActionType, setPrintActionType] = useState('All');
  const [printFromDate, setPrintFromDate] = useState(fromDate);
  const [printToDate, setPrintToDate] = useState(toDate);
  const generatedAt = useMemo(() => new Date(), []);

  useEffect(() => {
    let mounted = true;

    async function loadActivityLog() {
      try {
        setLoading(true);
        setError('');
        const { data, error: logError } = await supabase
          .from('admin_activity_log')
          .select('*')
          .order('created_at', { ascending: false });

        if (logError) throw logError;
        if (mounted) {
          setRows((data || []) as ActivityLogRow[]);
        }
      } catch (err) {
        if (mounted) {
          setError(toErrorMessage(err, 'Unable to load activity log.'));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadActivityLog();

    return () => {
      mounted = false;
    };
  }, []);

  const actionOptions = useMemo(
    () => ['All', ...Array.from(new Set(rows.map((row) => row.action_type).filter((value): value is string => Boolean(value))))],
    [rows]
  );

  const visibleRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;

    return rows.filter((row) => String(row.target_user_email || '').toLowerCase().includes(term));
  }, [rows, search]);

  const reportPreviewRows = useMemo(
    () => getReportRows(rows, fromDate, toDate, actionType),
    [actionType, fromDate, rows, toDate]
  );

  const reportRows = printData.length > 0 ? printData : reportPreviewRows;
  const approvalCount = reportRows.filter((row) => isApproval(row.action_type)).length;
  const rejectionCount = reportRows.filter((row) => isRejection(row.action_type)).length;
  const reportActionLabel = printActionType === 'All' ? 'All' : humanizeAction(printActionType);

  function handleDownload() {
    const filtered = getReportRows(rows, fromDate, toDate, actionType);

    setPrintData(filtered);
    setPrintActionType(actionType);
    setPrintFromDate(fromDate);
    setPrintToDate(toDate);

    setTimeout(() => {
      window.print();
    }, 300);
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #activity-report-print,
          #activity-report-print * {
            visibility: visible;
          }
          #activity-report-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            opacity: 1 !important;
            pointer-events: auto !important;
          }
        }
      `}</style>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Admin control center</p>
        <h2 className="mt-2 text-3xl font-black">Admin Activity History</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
          Review approvals, rejections, account changes, and other administrator actions.
        </p>
      </div>

      {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">{error}</p>}

      <section className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.055] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Download Report</p>
            <p className="mt-2 text-sm leading-6 text-white/45">
              These controls only affect the PDF report. The activity list below remains complete.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[180px_180px_240px_auto]">
            <label className="grid gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">From Date</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/50"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">To Date</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/50"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Filter by Action</span>
              <select
                value={actionType}
                onChange={(event) => setActionType(event.target.value)}
                className="h-11 rounded-xl border border-white/10 bg-[#111] px-3 text-sm font-bold text-white outline-none focus:border-[#D4AF37]/50"
              >
                {actionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All Actions' : humanizeAction(option)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-[#D4AF37] px-5 text-sm font-semibold text-[#0A0A0A] transition hover:bg-[#F5D06B] sm:col-span-2 lg:col-span-1 lg:self-end"
            >
              <Download size={16} />
              Download Report (PDF)
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by member email"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-3 text-sm font-semibold text-white outline-none placeholder:text-white/25 focus:border-[#D4AF37]/50"
          />
        </label>
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-widest text-white/35">
              <tr>
                <th className="px-4 py-4">Date</th>
                <th className="px-4 py-4">Action</th>
                <th className="px-4 py-4">Member Email</th>
                <th className="px-4 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm font-semibold text-white/40">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                      Loading activity log...
                    </span>
                  </td>
                </tr>
              ) : visibleRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center text-sm font-semibold text-white/40">
                    No activity found.
                  </td>
                </tr>
              ) : (
                visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-4 text-white/55">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-4 font-black text-white">{humanizeAction(row.action_type)}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white/75">{row.target_user_email || 'Not available'}</p>
                      <p className="mt-1 font-mono text-xs text-white/35">{row.target_user_id || ''}</p>
                    </td>
                    <td className="px-4 py-4 text-xs leading-5 text-white/55">{compactDetails(row.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div
        id="activity-report-print"
        style={{
          position: 'fixed',
          left: '-10000px',
          top: 0,
          width: '210mm',
          minHeight: '297mm',
          opacity: 0,
          pointerEvents: 'none',
          background: '#ffffff',
          color: '#111111',
          fontFamily: 'Arial, sans-serif',
          padding: '28px',
        }}
      >
        <div style={{ minHeight: '270mm', border: '1px solid #D4AF37', padding: '28px' }}>
          <img
            src="https://smartsavecop.vercel.app/logo.png"
            width="80"
            style={{ display: 'block', margin: '0 auto 8px' }}
            alt="Smart Save Cooperative"
          />
          <p style={{ margin: 0, textAlign: 'center', color: '#D4AF37', fontSize: 13, fontWeight: 800, letterSpacing: '0.18em' }}>
            SMART SAVE COOPERATIVE
          </p>
          <h1 style={{ margin: '18px 0 8px', textAlign: 'center', fontSize: 28 }}>Admin Activity Report</h1>
          <p style={{ margin: '4px 0', textAlign: 'center', fontSize: 12 }}>Generated by: {adminEmail}</p>
          <p style={{ margin: '4px 0', textAlign: 'center', fontSize: 12 }}>
            Report Period: {formatReportDate(printFromDate)} to {formatReportDate(printToDate)}
          </p>
          <p style={{ margin: '4px 0', textAlign: 'center', fontSize: 12 }}>
            Action Filter: {printActionType === 'All' ? 'All' : humanizeAction(printActionType)}
          </p>
          <p style={{ margin: '4px 0 18px', textAlign: 'center', fontSize: 12 }}>Generated on: {formatGeneratedDate(generatedAt)}</p>
          <div style={{ height: 2, background: '#D4AF37', marginBottom: 22 }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#111111', color: '#ffffff' }}>
                <th style={{ padding: 9, textAlign: 'left' }}>Date</th>
                <th style={{ padding: 9, textAlign: 'left' }}>Action</th>
                <th style={{ padding: 9, textAlign: 'left' }}>Member Email</th>
                <th style={{ padding: 9, textAlign: 'left' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 18, textAlign: 'center', color: '#666666' }}>
                    No activity found for this report period.
                  </td>
                </tr>
              ) : (
                reportRows.map((row, index) => (
                  <tr key={row.id} style={{ background: index % 2 === 0 ? '#ffffff' : '#f7f4eb' }}>
                    <td style={{ borderBottom: '1px solid #e5e5e5', padding: 9 }}>{formatDate(row.created_at)}</td>
                    <td style={{ borderBottom: '1px solid #e5e5e5', padding: 9 }}>{humanizeAction(row.action_type)}</td>
                    <td style={{ borderBottom: '1px solid #e5e5e5', padding: 9 }}>
                      {row.target_user_email || row.target_user_id || 'Not available'}
                    </td>
                    <td style={{ borderBottom: '1px solid #e5e5e5', padding: 9 }}>{compactDetails(row.details)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div style={{ marginTop: 24, border: '1px solid #D4AF37', padding: 14 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 16 }}>Summary</h2>
            <p style={{ margin: '6px 0' }}>
              Total actions in period: <strong>{reportRows.length}</strong>
            </p>
            <p style={{ margin: '6px 0' }}>
              Approvals: <strong>{approvalCount}</strong>
            </p>
            <p style={{ margin: '6px 0' }}>
              Rejections: <strong>{rejectionCount}</strong>
            </p>
          </div>

          <footer style={{ marginTop: 28, borderTop: '1px solid #D4AF37', paddingTop: 14, textAlign: 'center', fontSize: 11, color: '#555555' }}>
            <p style={{ margin: '4px 0', fontWeight: 700, color: '#111111' }}>Smart Save Cooperative Society</p>
            <p style={{ margin: '4px 0' }}>smartsavecooperative@gmail.com</p>
            <p style={{ margin: '8px 0 0' }}>This report is confidential and intended for authorized use only.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
