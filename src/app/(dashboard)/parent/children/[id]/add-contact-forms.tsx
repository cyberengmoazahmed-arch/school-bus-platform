"use client";

import { useState } from "react";
import { Plus, Users, Phone } from "lucide-react";
import { addPickupPersonAction, addEmergencyContactAction } from "@/app/actions/children";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export function AddContactForms({ studentId, kind }: { studentId: string; kind: "pickup" | "emergency" }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const fn = kind === "pickup" ? addPickupPersonAction : addEmergencyContactAction;

  return (
    <div>
      {open ? (
        <form
          action={async (form: FormData) => {
            setPending(true);
            try {
              await fn(studentId, form);
            } finally {
              setPending(false);
            }
          }}
          className="mt-2 space-y-2 rounded-lg border border-border bg-muted/30 p-3"
        >
          <Input name="name" placeholder={kind === "pickup" ? "Person's full name" : "Contact name"} />
          <Input name="phone" type="tel" placeholder="Phone" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" variant={kind === "pickup" ? "primary" : "outline"} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          {kind === "pickup" ? <Users size={14} /> : <Phone size={14} />} <Plus size={14} /> Add
        </Button>
      )}
    </div>
  );
}