import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const sessionResult = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  if (sessionResult.error) {
    return new Response("Sessão inválida.", { status: 401 });
  }

  const formData = await request.formData();

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const image_url = String(formData.get("image_url") ?? "").trim();
  const project_url = String(formData.get("project_url") ?? "").trim();
  const github_url = String(formData.get("github_url") ?? "").trim();
  const tagsRaw = String(formData.get("tags") ?? "").trim();

  if (!title || !description) {
    return new Response("Título e descrição são obrigatórios.", {
      status: 400,
    });
  }

  const tags = tagsRaw
    ? tagsRaw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const { data: createdProject, error: createError } = await supabase
    .from("projects")
    .insert({
      title,
      description,
      image_url: image_url,
      project_url: project_url || null,
      github_url: github_url || null,
      tags,
    })
    .select("id")
    .single();

  if (createError || !createdProject) {
    return new Response(createError?.message || "Erro ao criar projeto.", {
      status: 500,
    });
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
        project_id: createdProject.id,
        filter_option_id: option.id,
      }));

      const { error: relationError } = await supabase
        .from("project_filter_values")
        .insert(relations);

      if (relationError) {
        return new Response(
          `Projeto criado, mas falhou ao salvar filtros: ${relationError.message}`,
          { status: 500 },
        );
      }
    }
  }

  return new Response("Projeto criado com sucesso.", { status: 200 });
};