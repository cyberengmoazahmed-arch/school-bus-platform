import Link from "next/link";
import { Info } from "lucide-react";
import { requireUser } from "@/data/auth";
import { getChildrenForParent } from "@/data/parent";
import { getT } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { TripLiveView } from "./trip-live-view";

export default async function TrackingPage() {
  const user = await requireUser();
  const { locale, t } = await getT();
  const children = await getChildrenForParent(user.id);
  const childIds = children.map((c) => c.id);

  if (childIds.length === 0) {
    return (
      <EmptyState
        title="No children linked"
        description="Add a child first to track their bus."
        action={
          <Link href="/parent/children">
            <Button>Add a child</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{t.parent.trackLive}</h1>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info size={14} /> Live stream — refreshes automatically every few seconds.
        </p>
      </div>
      <Card className="p-4">
        <TripLiveView studentIds={childIds} />
      </Card>
    </div>
  );
}