import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const formData = await request.formData();

  const id = formData.get("id")?.toString().trim();
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const tagsRaw = formData.get("tags")?.toString().trim() ?? "";
  const image_url = formData.get("image_url")?.toString().trim();
  const project_url = formData.get("project_url")?.toString().trim();
  const github_url = formData.get("github_url")?.toString().trim();

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  if (!id || !title || !description) {
    return new Response("Campos obrigatórios ausentes.", { status: 400 });
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const { data: sessionData, error: sessionError } =
    await supabase.auth.setSession({
      access_token: accessToken.value,
      refresh_token: refreshToken.value,
    });

  if (sessionError || !sessionData.user) {
    return new Response("Sessão inválida.", { status: 401 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({
      title,
      description,
      tags,
      image_url: image_url,
      project_url: project_url || null,
      github_url: github_url || null,
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return new Response(`Erro Supabase: ${error?.message ?? "Erro ao atualizar projeto."}`, {
      status: 500,
    });
  }

  const { error: deleteRelationsError } = await supabase
    .from("project_filter_values")
    .delete()
    .eq("project_id", id);

  if (deleteRelationsError) {
    return new Response(
      `Projeto atualizado, mas falhou ao limpar filtros antigos: ${deleteRelationsError.message}`,
      { status: 500 },
    );
  }

  if (tags.length > 0) {
    const { data: filterOptions, error: optionsError } = await supabase
      .from("filter_options")
      .select("id, slug")
      .in("slug", tags);

    if (optionsError) {
      return new Response(`Erro ao buscar filtros: ${optionsError.message}`, {
        status: 500,
      });
    }

    if (filterOptions?.length) {
      const relations = filterOptions.map((option) => ({
        project_id: id,
        filter_option_id: option.id,
      }));

      const { error: insertRelationsError } = await supabase
        .from("project_filter_values")
        .insert(relations);

      if (insertRelationsError) {
        return new Response(
          `Projeto atualizado, mas falhou ao salvar filtros: ${insertRelationsError.message}`,
          { status: 500 },
        );
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      updated: data,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};