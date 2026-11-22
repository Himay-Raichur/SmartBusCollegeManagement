import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import useDebounce from "../../hooks/useDebounce.js";
import { errMsg, fmtDate } from "../../utils/format.js";
import { Badge, Button, ConfirmDialog, DataTable, Modal, PageHeader, Pagination, SearchBox, Spinner, inputCls } from "../../components/ui.jsx";
import { FormModal } from "../../components/FormModal.jsx";

const BASE = [
  { name: "name", label: "Full name", required: true, half: true },
  { name: "email", label: "Email", type: "email", required: true, half: true },
  { name: "phone", label: "Phone", type: "tel", half: true },
  { name: "studentId", label: "Student ID", required: true, half: true },
  { name: "department", label: "Department", required: true, half: true },
  { name: "year", label: "Year", type: "select", required: true, half: true, options: [1, 2, 3, 4].map((y) => ({ value: y, label: `Year ${y}` })) },
  { name: "section", label: "Section", half: true },
  { name: "address", label: "Address", half: true },
];
const CREATE_FIELDS = [...BASE, { name: "password", label: "Password", type: "password", required: true, minLength: 6 }];

function StudentDetail({ id, onClose }) {
  const { data, loading } = useFetch(`/students/${id}`);
  return (
    <Modal open title="Student details" onClose={onClose}>
      {loading || !data ? <Spinner /> : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          {[
            ["Name", data.user?.name], ["Student ID", data.studentId], ["Email", data.user?.email], ["Phone", data.user?.phone || "—"],
            ["Department", `${data.department} · Year ${data.year} ${data.section || ""}`], ["Address", data.address || "—"],
            ["Route", data.route?.name || "Not assigned"], ["Bus", data.bus?.busNumber || "Not assigned"],
          ].map(([k, v]) => <div key={k}><dt className="text-xs text-slate-500">{k}</dt><dd className="text-slate-800">{v}</dd></div>)}
          <div><dt className="text-xs text-slate-500">Latest pass</dt>
            <dd>{data.latestPass ? <><Badge value={data.latestPass.status} /> <span className="text-xs text-slate-500">{data.latestPass.passId} · until {fmtDate(data.latestPass.validUntil)}</span></> : "No pass applied"}</dd>
          </div>
        </dl>
      )}
    </Modal>
  );
}

export default function Students() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const [route, setRoute] = useState("");
  const [status, setStatus] = useState("");
  const { data, meta, loading, error, reload } = useFetch("/students", { q: dq || undefined, page, limit: 10, route: route || undefined, status: status || undefined });
  const routes = useFetch("/routes", { limit: 100 });
  const buses = useFetch("/buses", { limit: 100 });
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [view, setView] = useState(null);
  const [busy, setBusy] = useState(false);

  const editFields = [
    ...BASE.filter((f) => f.name !== "studentId"),
    { name: "route", label: "Assigned route", type: "select", half: true, emptyLabel: "None", options: (routes.data || []).map((r) => ({ value: r._id, label: `${r.routeNumber} - ${r.name}` })) },
    { name: "bus", label: "Assigned bus", type: "select", half: true, emptyLabel: "None", options: (buses.data || []).map((b) => ({ value: b._id, label: b.busNumber })) },
    { name: "isActive", label: "Account status", type: "select", noEmpty: true, half: true, options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] },
    { name: "password", label: "New password (optional)", type: "password", minLength: 6, half: true },
  ];

  const submit = async (v) => {
    if (form.mode === "create") {
      await api.post("/students", { ...v, year: Number(v.year) });
      toast.success("Student added");
    } else {
      await api.put(`/students/${form.student._id}`, { ...v, year: Number(v.year), isActive: v.isActive === "true" });
      toast.success("Student updated");
    }
    setForm(null);
    reload();
  };

  const toggle = async () => {
    setBusy(true);
    try {
      if (confirm.user.isActive) await api.delete(`/students/${confirm._id}`);
      else await api.put(`/students/${confirm._id}`, { isActive: true });
      toast.success("Account updated");
      setConfirm(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const columns = [
    { header: "Student ID", render: (s) => s.studentId },
    { header: "Name", render: (s) => <div><p>{s.user?.name}</p><p className="text-xs text-slate-500">{s.user?.email}</p></div> },
    { header: "Dept / Year", render: (s) => `${s.department} · Y${s.year}${s.section ? ` ${s.section}` : ""}` },
    { header: "Route", render: (s) => s.route?.routeNumber || "—" },
    { header: "Bus", render: (s) => s.bus?.busNumber || "—" },
    { header: "Status", render: (s) => <Badge value={s.user?.isActive ? "active" : "inactive"} /> },
    {
      header: "Actions",
      render: (s) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setView(s._id)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => setForm({ mode: "edit", student: s })}>Edit</Button>
          <Button size="sm" variant={s.user?.isActive ? "danger" : "accent"} onClick={() => setConfirm(s)}>{s.user?.isActive ? "Deactivate" : "Activate"}</Button>
        </div>
      ),
    },
  ];

  const initial = form?.mode === "edit"
    ? {
        name: form.student.user?.name, email: form.student.user?.email, phone: form.student.user?.phone || "",
        department: form.student.department, year: form.student.year, section: form.student.section || "", address: form.student.address || "",
        route: form.student.route?._id || "", bus: form.student.bus?._id || "", isActive: String(form.student.user?.isActive),
      }
    : {};

  return (
    <>
      <PageHeader title="Students" action={<Button onClick={() => setForm({ mode: "create" })}><Plus size={16} /> Add student</Button>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="w-64"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email, ID" /></div>
        <select className={`${inputCls} w-auto`} value={route} onChange={(e) => { setRoute(e.target.value); setPage(1); }}>
          <option value="">All routes</option>
          {routes.data?.map((r) => <option key={r._id} value={r._id}>{r.routeNumber} - {r.name}</option>)}
        </select>
        <select className={`${inputCls} w-auto`} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option>
        </select>
      </div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No students match your filters" />
      <Pagination meta={meta} onPage={setPage} />

      <FormModal open={!!form} title={form?.mode === "create" ? "Add student" : "Edit student"} fields={form?.mode === "create" ? CREATE_FIELDS : editFields} initial={initial} onClose={() => setForm(null)} onSubmit={submit} />
      <ConfirmDialog open={!!confirm} danger={confirm?.user?.isActive} loading={busy} title={confirm?.user?.isActive ? "Deactivate student?" : "Activate student?"}
        message={confirm?.user?.isActive ? "The student will no longer be able to log in. History is kept." : "The student will be able to log in again."}
        confirmLabel={confirm?.user?.isActive ? "Deactivate" : "Activate"} onConfirm={toggle} onCancel={() => setConfirm(null)} />
      {view && <StudentDetail id={view} onClose={() => setView(null)} />}
    </>
  );
}