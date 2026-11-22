import { useState } from "react";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import useDebounce from "../../hooks/useDebounce.js";
import { errMsg } from "../../utils/format.js";
import { Badge, Button, ConfirmDialog, DataTable, PageHeader, Pagination, SearchBox } from "../../components/ui.jsx";
import { FormModal } from "../../components/FormModal.jsx";

const BASE = [
  { name: "name", label: "Full name", required: true, half: true },
  { name: "email", label: "Email", type: "email", required: true, half: true },
  { name: "phone", label: "Phone", type: "tel", half: true },
  { name: "licenseNumber", label: "License number", required: true, half: true },
];
const CREATE = [...BASE, { name: "password", label: "Password", type: "password", required: true, minLength: 6 }];
const EDIT = [
  ...BASE,
  { name: "isActive", label: "Account status", type: "select", noEmpty: true, half: true, options: [{ value: "true", label: "Active" }, { value: "false", label: "Inactive" }] },
  { name: "password", label: "New password (optional)", type: "password", minLength: 6, half: true },
];

export default function Drivers() {
  const [q, setQ] = useState("");
  const dq = useDebounce(q);
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useFetch("/drivers", { q: dq || undefined, page, limit: 10 });
  const [form, setForm] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (v) => {
    if (form.mode === "create") {
      await api.post("/drivers", v);
      toast.success("Driver added");
    } else {
      await api.put(`/drivers/${form.driver._id}`, { ...v, isActive: v.isActive === "true" });
      toast.success("Driver updated");
    }
    setForm(null);
    reload();
  };

  const toggle = async () => {
    setBusy(true);
    try {
      if (confirm.user.isActive) await api.delete(`/drivers/${confirm._id}`);
      else await api.put(`/drivers/${confirm._id}`, { isActive: true });
      toast.success("Account updated");
      setConfirm(null);
      reload();
    } catch (e) { toast.error(errMsg(e)); } finally { setBusy(false); }
  };

  const columns = [
    { header: "Name", render: (d) => <div><p>{d.user?.name}</p><p className="text-xs text-slate-500">{d.user?.email}</p></div> },
    { header: "Phone", render: (d) => d.user?.phone || "—" },
    { header: "License", render: (d) => d.licenseNumber },
    { header: "Bus", render: (d) => d.bus?.busNumber || "Unassigned" },
    { header: "Status", render: (d) => <Badge value={d.user?.isActive ? "active" : "inactive"} /> },
    {
      header: "Actions",
      render: (d) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setForm({ mode: "edit", driver: d })}>Edit</Button>
          <Button size="sm" variant={d.user?.isActive ? "danger" : "accent"} onClick={() => setConfirm(d)}>{d.user?.isActive ? "Deactivate" : "Activate"}</Button>
        </div>
      ),
    },
  ];
  const initial = form?.mode === "edit"
    ? { name: form.driver.user?.name, email: form.driver.user?.email, phone: form.driver.user?.phone || "", licenseNumber: form.driver.licenseNumber, isActive: String(form.driver.user?.isActive) }
    : {};

  return (
    <>
      <PageHeader title="Drivers" subtitle="Assign a driver to a bus from the Buses page" action={<Button onClick={() => setForm({ mode: "create" })}><Plus size={16} /> Add driver</Button>} />
      <div className="mb-4 w-64"><SearchBox value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Search name, email, license" /></div>
      <DataTable columns={columns} rows={data} loading={loading} error={error} onRetry={reload} emptyText="No drivers found" />
      <Pagination meta={meta} onPage={setPage} />
      <FormModal open={!!form} title={form?.mode === "create" ? "Add driver" : "Edit driver"} fields={form?.mode === "create" ? CREATE : EDIT} initial={initial} onClose={() => setForm(null)} onSubmit={submit} />
      <ConfirmDialog open={!!confirm} danger={confirm?.user?.isActive} loading={busy} title={confirm?.user?.isActive ? "Deactivate driver?" : "Activate driver?"}
        message="This changes whether the driver can log in. Trip history is kept." confirmLabel={confirm?.user?.isActive ? "Deactivate" : "Activate"} onConfirm={toggle} onCancel={() => setConfirm(null)} />
    </>
  );
}