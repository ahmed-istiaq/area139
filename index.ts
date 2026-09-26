import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    const title = String(body.title || "New Post Published");
    const message = String(body.message || "A new post has been published on AREA_139.");
    const url = String(body.url || "https://ahmed-istiaq.github.io/area139/");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidSubject = Deno.env.get("VAPID_SUBJECT");

    if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
      throw new Error("Required Edge Function secrets are missing.");
    }

    webpush.setVapidDetails(
      vapidSubject,
      vapidPublicKey,
      vapidPrivateKey
    );

    const response = await fetch(
      `${supabaseUrl}/rest/v1/push_subscriptions?select=id,subscription`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Could not load subscriptions: ${response.status}`);
    }

    const subscriptions = await response.json();

    const payload = JSON.stringify({
      title,
      body: message,
      url
    });

    let sent = 0;
    let removed = 0;

    for (const row of subscriptions) {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent++;
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await fetch(
            `${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${encodeURIComponent(row.id)}`,
            {
              method: "DELETE",
              headers: {
                apikey: serviceRoleKey,
                Authorization: `Bearer ${serviceRoleKey}`
              }
            }
          );
          removed++;
        } else {
          console.error("Push delivery failed:", error);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent,
        removed
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Push notification failed."
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
