import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";

// One-time setup endpoint (verify_jwt off, see config.toml). `state`
// is the only gate -- rotate GOOGLE_OAUTH_STATE once setup is done.
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}

function htmlResponse(status: number, title: string, message: string) {
  return new Response(
    `<!doctype html><html><body style="font-family:sans-serif;max-width:480px;margin:80px auto;text-align:center">
      <h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p>
    </body></html>`,
    { status, headers: { "Content-Type": "text/html" } },
  );
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (!state || state !== Deno.env.get("GOOGLE_OAUTH_STATE")) {
    return htmlResponse(400, "Invalid request", "Missing or mismatched state.");
  }
  if (oauthError) {
    return htmlResponse(400, "Authorization failed", oauthError);
  }
  if (!code) {
    return htmlResponse(400, "Invalid request", "Missing authorization code.");
  }

  const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET") ?? "";
  const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google_oauth_callback`;

  let tokenData: Record<string, unknown>;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.refresh_token) {
      console.error("google_oauth_callback.token_exchange_error", tokenData);
      return htmlResponse(
        500,
        "Token exchange failed",
        "Google didn't return a refresh token. If you've authorized this app before, revoke its access at https://myaccount.google.com/permissions and try again (Google only issues a refresh token on the first consent).",
      );
    }
  } catch (err) {
    console.error("google_oauth_callback.token_exchange_error", err);
    return htmlResponse(500, "Token exchange failed", "Could not reach Google. Try again.");
  }

  const { error: dbError } = await supabaseAdmin.from("oauth_tokens").upsert(
    {
      provider: "google_drive",
      refresh_token: tokenData.refresh_token,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider" },
  );

  if (dbError) {
    console.error("google_oauth_callback.db_error", dbError);
    return htmlResponse(500, "Save failed", "Token exchange succeeded but saving it failed. Check the function logs.");
  }

  return htmlResponse(
    200,
    "Google Drive connected",
    "You can close this tab.",
  );
});
