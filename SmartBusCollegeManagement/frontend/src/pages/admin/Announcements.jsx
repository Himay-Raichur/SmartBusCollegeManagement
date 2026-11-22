import { useState } from "react";
import toast from "react-hot-toast";
import api from "../../services/api.js";
import useFetch from "../../hooks/useFetch.js";
import { Card, PageHeader } from "../../components/ui.jsx";
import { DynamicForm } from "../../components/FormModal.jsx";

export default function Announcements() {
  const routes = useFetch("/routes", { limit: 100 });
  const [key, setKey] = useState(0);

  const fields = [
    { name: "title", label: "Title", required: true },
    { name: "message", label: "Message", type: "textarea", required: true },
    { name: "audience", label: "Audience", type: "select", noEmpty: true, half: true, options: [{ value: "students", label: "Students" }, { value: "drivers", label: "Drivers" }, { value: "all", label: "Students and drivers" }] },
    { name: "type", label: "Type", type: "select", noEmpty: true, half: true, options: [{ value: "announcement", label: "Announcement" }, { value: "delay", label: "Bus delay" }] },
    { name: "route", label: "Limit to route (optional)", type: "select", emptyLabel: "All routes", options: (routes.data || []).map((r) => ({ value: r._id, label: `${r.routeNumber} - ${r.name}` })) },
  ];

  const submit = async (v) => {
    const { data } = await api.post("/notifications/announcements", v);
    toast.success(data.message);
    setKey((k) => k + 1); // remounts the form to clear it
  };

  return (
    <>
      <PageHeader title="Announcements" subtitle="Sent as in-app notifications" />
      <Card className="max-w-2xl">
        <DynamicForm key={key} fields={fields} initial={{ audience: "students", type: "announcement" }} onSubmit={submit} submitLabel="Send announcement" />
      </Card>
    </>
  );
}