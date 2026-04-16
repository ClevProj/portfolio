import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const accessToken = cookies.get("sb-access-token");
    const refreshToken = cookies.get("sb-refresh-token");

    if (!accessToken || !refreshToken) {
      return new Response("Não autenticado.", { status: 401 });
    }

    const formData = await request.formData();

    const id = formData.get("id")?.toString().trim();
    const group_id = formData.get("group_id")?.toString().trim();
    const label = formData.get("label")?.toString().trim();
    const slug = formData.get("slug")?.toString().trim();
    const sortOrderRaw = formData.get("sort_order")?.toString().trim() ?? "0";
    const isActive = formData.get("is_active") === "on";

    if (!group_id || !label || !slug) {
      return new Response("Campos obrigatórios ausentes.", { status: 400 });
    }

    const sort_order = Number(sortOrderRaw) || 0;

    const supabase = createClient(
      import.meta.env.PUBLIC_SUPABASE_URL,
      import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

    if (sessionError || !sessionData.user) {
      return new Response("Sessão inválida.", { status: 401 });
    }

    if (id) {
      const { error } = await supabase
        .from("filter_options")
        .update({
          group_id,
          label,
          slug,
          sort_order,
          is_active: isActive,
        })
        .eq("id", id);

      if (error) return new Response(error.message, { status: 500 });
      return new Response("OK", { status: 200 });
    }

    const { error } = await supabase
      .from("filter_options")
      .insert({
        group_id,
        label,
        slug,
        sort_order,
        is_active: isActive,
      });

    if (error) return new Response(error.message, { status: 500 });

    return new Response("OK", { status: 200 });
  } catch {
    return new Response("Erro interno no servidor.", { status: 500 });
  }
};