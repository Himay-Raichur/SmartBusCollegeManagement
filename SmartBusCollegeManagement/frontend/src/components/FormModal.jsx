import { useState } from "react";
import toast from "react-hot-toast";
import { Button, Field, Modal, inputCls } from "./ui.jsx";
import { errMsg } from "../utils/format.js";

const isEmpty = (v) => v === undefined || v === null || String(v).trim() === "";

export function DynamicForm({ fields, initial, onSubmit, onCancel, submitLabel = "Save" }) {
  const [values, setValues] = useState(initial || {});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    for (const f of fields) {
      const v = values[f.name];
      if (f.required && isEmpty(v)) errs[f.name] = `${f.label} is required`;
      else if (!isEmpty(v) && f.type === "email" && !/^\S+@\S+\.\S+$/.test(v)) errs[f.name] = "Enter a valid email";
      else if (!isEmpty(v) && f.type === "tel" && !/^[0-9+\-\s]{7,15}$/.test(v)) errs[f.name] = "Enter a valid phone number";
      else if (!isEmpty(v) && f.minLength && String(v).length < f.minLength) errs[f.name] = `Minimum ${f.minLength} characters`;
      else if (!isEmpty(v) && f.type === "number" && f.min !== undefined && Number(v) < f.min) errs[f.name] = `Minimum value is ${f.min}`;
      else if (!isEmpty(v) && f.pattern && !f.pattern.test(v)) errs[f.name] = f.patternMessage || "Invalid format";
    }
    for (const f of fields) if (f.matches && values[f.name] !== values[f.matches]) errs[f.name] = `${f.label} does not match`;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => {
          const common = {
            name: f.name,
            value: values[f.name] ?? "",
            onChange: (e) => set(f.name, e.target.value),
            placeholder: f.placeholder,
            className: `${inputCls} ${errors[f.name] ? "border-red-400" : ""}`,
          };
          return (
            <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
              <Field label={f.label + (f.required ? " *" : "")} error={errors[f.name]}>
                {f.type === "select" ? (
                  <select {...common}>
                    {!f.noEmpty && <option value="">{f.emptyLabel || "Select..."}</option>}
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea rows={3} {...common} />
                ) : (
                  <input type={f.type || "text"} step={f.step} min={f.min} {...common} />
                )}
              </Field>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-end gap-2">
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
        <Button type="submit" loading={saving}>{submitLabel}</Button>
      </div>
    </form>
  );
}

// The form is only mounted while open, so every open starts with fresh state.
export function FormModal({ open, title, onClose, ...rest }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      {open && <DynamicForm {...rest} onCancel={onClose} />}
    </Modal>
  );
}