"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { addChildAction, type ChildActionState } from "@/app/actions/children";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { resolve, type Locale } from "@/lib/i18n/client";

type SchoolOption = { id: string; name: string; city: string };

function sectionLabel(locale: Locale) {
  return locale === "ar" ? "أضف طفلاً" : "Add child";
}

export function AddChildForm({ locale, schools }: { locale: Locale; schools: SchoolOption[] }) {
  const [state, action, pending] = useActionState<ChildActionState, FormData>(addChildAction, {});
  const [open, setOpen] = useState(false);
  const err = (f: string) => (state.fieldErrors?.[f] ? "This field is required." : undefined);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus size={16} /> {sectionLabel(locale)}
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="First name" error={err("firstName")}>
            <Input name="firstName" placeholder="Ahmed" disabled={pending} />
          </Field>
          <Field label="Last name" error={err("lastName")}>
            <Input name="lastName" placeholder="Hassan" disabled={pending} />
          </Field>
          <Field label="Grade" error={err("grade")}>
            <Select name="grade" defaultValue="G1" disabled={pending}>
              {["KG1", "KG2", "G1", "G2", "G3", "G4", "G5", "G6", "G7", "G8", "G9", "G10", "G11", "G12"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="School" error={err("schoolId")}>
            <Select name="schoolId" defaultValue="" disabled={pending}>
              <option value="" disabled>
                Choose…
              </option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {s.city}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guardian relation" error={err("relation")}>
            <Select name="relation" defaultValue="FATHER" disabled={pending}>
              {["FATHER", "MOTHER", "GUARDIAN", "OTHER"].map((r) => (
                <option key={r} value={r}>
                  {r[0] + r.slice(1).toLowerCase()}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Guardian phone" hint="Optional">
            <Input name="phone" type="tel" placeholder="+20 100 000 0000" disabled={pending} />
          </Field>
          <Field label="Home address label" hint="e.g. 12 El-Tahrir St, Dokki">
            <Input name="homeLabel" placeholder="Address label" disabled={pending} />
          </Field>
          <Field label="GPS link" hint="If skipped, uses the school location in the demo.">
            <Input name="homeLine" placeholder="Latitude, Longitude (e.g. 30.04, 31.23)" disabled={pending} />
          </Field>

          <div className="flex items-end gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Add child"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}