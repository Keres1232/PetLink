// Supabase Edge Function: envía una notificación push (Firebase Cloud Messaging)
// cada vez que se crea una fila en public.notifications.
//
// Se dispara con un Database Webhook (Database → Webhooks):
//   tabla public.notifications · evento INSERT · tipo "Supabase Edge Functions" · función send-push
//
// Secretos necesarios (Edge Functions → Secrets):
//   FIREBASE_SERVICE_ACCOUNT  → el JSON completo de la cuenta de servicio de Firebase
//   (SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya existen por defecto)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { GoogleAuth } from "npm:google-auth-library@9.14.1";

const serviceAccount = JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") ?? "{}");
const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const auth = new GoogleAuth({
  credentials: serviceAccount,
  scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
});

Deno.serve(async (req) => {
  const payload = await req.json();
  const n = payload.record as {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    reference_id: string | null;
  };
  if (!n?.user_id) return new Response("sin notificación", { status: 400 });

  const { data: tokens } = await supabase.from("push_tokens").select("token").eq("user_id", n.user_id);
  if (!tokens?.length) return new Response("el usuario no tiene celulares registrados");

  const accessToken = await auth.getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;

  for (const { token } of tokens) {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: n.title, body: n.body ?? "" },
          data: { notification_id: n.id, type: n.type, reference_id: n.reference_id ?? "" },
          android: { priority: "high", notification: { channel_id: "alertas" } },
        },
      }),
    });
    // Token viejo o desinstalado: se borra para no volver a intentarlo
    if (res.status === 404 || res.status === 400) {
      await supabase.from("push_tokens").delete().eq("token", token);
    }
  }

  return new Response("ok");
});
