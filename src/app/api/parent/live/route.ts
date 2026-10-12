import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getParentDashboard } from "@/data/parent";

/**
 * Server-Sent Events stream of the parent's live trip data.
 * Pushes a fresh snapshot every 3 seconds while the client is connected.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* client gone */
        }
      };

      send({ type: "hello", at: new Date().toISOString() });

      const timer = setInterval(async () => {
        try {
          const cards = await getParentDashboard(session.id);
          send({
            type: "snapshot",
            at: new Date().toISOString(),
            cards: cards.map((c) => ({
              studentId: c.studentId,
              studentName: c.studentName,
              grade: c.grade,
              schoolName: c.schoolName,
              tripStatus: c.tripStatus,
              direction: c.direction,
              busCode: c.busCode,
              driverName: c.driverName,
              assignmentStatus: c.assignmentStatus,
              etaMinutes: c.etaMinutes,
              distanceKm: c.distanceKm,
              live: c.live
                ? {
                    lat: c.live.lat,
                    lng: c.live.lng,
                    speed: c.live.speed,
                    stale: c.live.stale,
                    recordedAt: c.live.recordedAt.toISOString(),
                  }
                : null,
            })),
          });
        } catch (error) {
          send({ type: "error", message: String(error) });
        }
      }, 3000);

      request.signal.addEventListener("abort", () => {
        clearInterval(timer);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}