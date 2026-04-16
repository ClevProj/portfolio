import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";

export const prerender = false;

const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();

  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response("Email e senha são obrigatórios.", { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return new Response("Email ou senha inválidos.", { status: 401 });
  }

  const { access_token, refresh_token } = data.session;

  cookies.set("sb-access-token", access_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  cookies.set("sb-refresh-token", refresh_token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  return redirect("/admin");
};