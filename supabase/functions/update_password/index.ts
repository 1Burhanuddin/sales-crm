import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { corsHeaders, OptionsMiddleware } from "../_shared/cors.ts";
import { createErrorResponse } from "../_shared/utils.ts";
import { supabaseAdmin } from "../_shared/supabaseAdmin.ts";
import { AuthMiddleware, UserMiddleware } from "../_shared/authentication.ts";
import { getUserSale } from "../_shared/getUserSale.ts";

// Sets the password directly, no email involved -- invite/reset emails
// are unreliable on this project (hit Supabase's send-rate-limit fast, no
// custom SMTP configured), same reason accounts are created with a
// directly-shared password rather than an invite link.
async function updatePassword(currentUserSale: any, req: Request) {
  const { sales_id, new_password } = await req.json();

  if (typeof new_password !== "string" || new_password.length < 6) {
    return createErrorResponse(400, "Password must be at least 6 characters");
  }

  // Users can only change their own password unless they are an administrator.
  if (!currentUserSale.administrator && currentUserSale.id !== sales_id) {
    return createErrorResponse(401, "Not Authorized");
  }

  let targetUserId = currentUserSale.user_id;
  if (sales_id !== currentUserSale.id) {
    const { data: targetSale, error: saleError } = await supabaseAdmin
      .from("sales")
      .select("user_id")
      .eq("id", sales_id)
      .single();

    if (!targetSale || saleError) {
      return createErrorResponse(404, "Not Found");
    }
    targetUserId = targetSale.user_id;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    targetUserId,
    { password: new_password },
  );

  if (!data || error) {
    console.error("update_password.error", error);
    return createErrorResponse(500, "Internal Server Error");
  }

  return new Response(
    JSON.stringify({
      data: true,
    }),
    {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    },
  );
}

Deno.serve(async (req: Request) =>
  OptionsMiddleware(req, async (req) =>
    AuthMiddleware(req, async (req) =>
      UserMiddleware(req, async (req, user) => {
        const currentUserSale = await getUserSale(user);
        if (!currentUserSale) {
          return createErrorResponse(401, "Unauthorized");
        }

        if (req.method === "PATCH") {
          return updatePassword(currentUserSale, req);
        }

        return createErrorResponse(405, "Method Not Allowed");
      }),
    ),
  ),
);
