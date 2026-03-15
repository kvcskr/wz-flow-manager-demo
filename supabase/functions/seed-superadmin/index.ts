import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const email = "superadmin@wz.pl";
  const password = "Super123!";

  // Create user
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (userError && !userError.message.includes("already been registered")) {
    return new Response(JSON.stringify({ error: userError.message }), { status: 400 });
  }

  let userId = userData?.user?.id;

  if (!userId) {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users?.find((u: any) => u.email === email);
    userId = existing?.id;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: "Could not find user" }), { status: 400 });
  }

  // Check if already assigned
  const { data: existing } = await supabase
    .from("uzytkownicy_organizacji")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await supabase
      .from("uzytkownicy_organizacji")
      .insert({ user_id: userId, rola: "superadmin", org_id: null });

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 400 });
    }
  }

  return new Response(JSON.stringify({ success: true, email, password }), {
    headers: { "Content-Type": "application/json" },
  });
});
