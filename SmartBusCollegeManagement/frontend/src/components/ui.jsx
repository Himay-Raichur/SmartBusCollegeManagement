import { useEffect } from "react";
import { Loader2, Inbox, AlertTriangle, X, Search } from "lucide-react";

export const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/30";

const VARIANTS = {
  primary: "bg-primary text-white hover:bg-primary/90",
  accent: "bg-accent text-white hover:bg-accent/90",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export function Button({ variant = "primary", size, loading, className = "", children, ...p }) {
  return (
    <button
      {...p}
      type={p.type || "button"}
      disabled={p.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-4 py-2 text-sm"
      } ${VARIANTS[variant]} ${className}`}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

export const Spinner = ({ size = 18 }) => <Loader2 size={size} className="animate-spin text-secondary" />;
export const PageLoader = () => (
  <div className="flex justify-center py-16">
    <Spinner size={28} />
  </div>
);

export const Empty = ({ text = "Nothing here yet" }) => (
  <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-12 text-slate-500">
    <Inbox size={28} />
    <p className="text-sm">{text}</p>
  </div>
);

export const ErrorBox = ({ message, onRetry }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 py-10 text-red-700">
    <AlertTriangle size={28} />
    <p className="text-sm">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    )}
  </div>
);

export const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    {(title || action) && (
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-semibold text-primary">{title}</h2>
        {action}
      </div>
    )}
    {children}
  </section>
);

const STAT_TONES = {
  primary: "bg-primary/10 text-primary",
  teal: "bg-accent/10 text-accent",
  sky: "bg-secondary/10 text-secondary",
  amber: "bg-amber-100 text-amber-700",
};
export const StatCard = ({ icon: Icon, label, value, tone = "primary" }) => (
  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className={`rounded-lg p-3 ${STAT_TONES[tone]}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-semibold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  </div>
);

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 className="text-xl font-semibold text-primary">{title}</h1>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const TONES = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};
const TONE_OF = {
  approved: "green", active: "green", valid: "green", completed: "green", available: "green", live: "green",
  pending: "amber", scheduled: "amber", maintenance: "amber", demo: "amber",
  rejected: "red", invalid: "red", expired: "red", route_mismatch: "red",
  inactive: "slate", cancelled: "slate",
};
const LABEL_OF = { demo: "Simulated (demo)", live: "Live GPS", route_mismatch: "Route mismatch" };
export function Badge({ value }) {
  const v = String(value || "—");
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${TONES[TONE_OF[v] || "slate"]}`}>
      {LABEL_OF[v] || v}
    </span>
  );
}

export function Modal({ open, title, onClose, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`my-8 w-full rounded-xl bg-white shadow-xl ${wide ? "max-w-4xl" : "max-w-lg"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="font-semibold text-primary">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", danger, loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="mb-5 text-sm text-slate-600">{message}</p>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

export function Pagination({ meta, onPage }) {
  if (!meta || meta.pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>Page {meta.page} of {meta.pages} · {meta.total} records</span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</Button>
        <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => onPage(meta.page + 1)}>Next</Button>
      </div>
    </div>
  );
}

export function DataTable({ columns, rows, loading, error, onRetry, emptyText }) {
  if (error) return <ErrorBox message={error} onRetry={onRetry} />;
  if (!rows) return <PageLoader />;
  if (!rows.length) return <Empty text={emptyText || "No records found"} />;
  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white ${loading ? "opacity-60" : ""}`}>
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>{columns.map((c) => <th key={c.header} className="whitespace-nowrap px-4 py-3 font-medium">{c.header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={r._id || i} className="hover:bg-slate-50">
              {columns.map((c) => <td key={c.header} className="whitespace-nowrap px-4 py-3 align-middle">{c.render(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const Field = ({ label, error, children }) => (
  <label className="block">
    <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
  </label>
);

export const SearchBox = ({ value, onChange, placeholder = "Search..." }) => (
  <div className="relative">
    <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
    <input className={`${inputCls} pl-9`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);