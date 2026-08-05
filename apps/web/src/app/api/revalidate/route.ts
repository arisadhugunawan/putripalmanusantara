import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand ISR revalidation webhook (docs/06-architecture.md §4, §7.1). Called by the
 * backend's RevalidationService after an admin publish/update, so SSG+ISR pages reflect
 * CMS changes without waiting for the periodic revalidate interval or a redeploy.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { secret?: string; paths?: string[] }
    | null;

  if (!body?.secret || body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: "Invalid secret" }, { status: 401 });
  }

  const paths = Array.isArray(body.paths) ? body.paths : [];
  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, paths });
}
