import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request, cookies }) => {
  const accessToken = cookies.get("sb-access-token");
  const refreshToken = cookies.get("sb-refresh-token");

  if (!accessToken || !refreshToken) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const formData = await request.formData();
  const id = formData.get("id")?.toString();

  if (!id) {
    return new Response("ID do projeto não informado.", { status: 400 });
  }

  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: accessToken.value,
    refresh_token: refreshToken.value,
  });

  if (sessionError) {
    return new Response("Sessão inválida.", { status: 401 });
  }

  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response("Projeto excluído com sucesso.", { status: 200 });
};