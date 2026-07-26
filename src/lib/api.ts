import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { HttpError } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400, extra?: object) {
  return NextResponse.json(
    { error: { message, ...extra } },
    { status },
  );
}

export async function parseJson<T>(req: Request, schema: ZodSchema<T>) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "بيانات JSON غير صالحة");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const message = first?.message ?? "بيانات غير صالحة";
    const err = new HttpError(422, message);
    (err as Error & { issues?: unknown }).issues = parsed.error.issues;
    throw err;
  }
  return parsed.data;
}

export function handleError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json(
      { error: { message: err.message } },
      { status: err.status },
    );
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          message: err.issues[0]?.message ?? "بيانات غير صالحة",
          issues: err.issues,
        },
      },
      { status: 422 },
    );
  }
  console.error("[api] unexpected error:", err);
  const message = err instanceof Error ? err.message : "خطأ غير متوقع";
  return NextResponse.json({ error: { message } }, { status: 500 });
}
