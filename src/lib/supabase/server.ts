import { createServerClient } from "@supabase/ssr";
import type { APIContext } from "astro";

export function createServerSupabaseClient(context: APIContext) {
  return createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          const cookieHeader = context.request.headers.get("cookie") ?? "";

          return cookieHeader
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const i = c.indexOf("=");
              return {
                name: c.slice(0, i),
                value: c.slice(i + 1),
              };
            });
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            context.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}