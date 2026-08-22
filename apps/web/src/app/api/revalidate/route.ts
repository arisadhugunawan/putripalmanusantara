import { SUPPORTED_LOCALES } from "@ppn/shared-types";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand ISR revalidation webhook (docs/06-architecture.md §4, §7.1). Called by the
 * backend's RevalidationService after an admin publish/update, so SSG+ISR pages reflect
 * CMS changes without waiting for the periodic revalidate interval or a redeploy.
 *
 * The backend sends plain, locale-less paths (e.g. "/products/x") — it doesn't know about
 * the frontend's [locale] routing segment. Every locale variant of each path is revalidated
 * here, since a product/article edit can affect the translated pages too.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { secret?: string; paths?: string[]; type?: "page" | "layout" }
    | null;

  if (!body?.secret || body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ revalidated: false, message: "Invalid secret" }, { status: 401 });
  }

  const paths = Array.isArray(body.paths) ? body.paths : [];
  const type = body.type === "layout" ? "layout" : "page";
  const revalidated: string[] = [];
  for (const path of paths) {
    for (const locale of SUPPORTED_LOCALES) {
      const localizedPath = `/${locale}${path === "/" ? "" : path}`;
      revalidatePath(localizedPath, type);
      revalidated.push(localizedPath);
    }
  }

  return NextResponse.json({ revalidated: true, paths: revalidated });
}
