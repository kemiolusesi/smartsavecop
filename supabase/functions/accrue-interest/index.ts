import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AccrualResult {
  plan_id: string;
  user_id: string;
  principal_amount: number;
  previous_interest: number;
  new_interest: number;
  interest_accrued: number;
  updated_at: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, serviceKey);

    const method = req.method;
    const url = new URL(req.url);

    if (method === 'POST') {
      const body = await req.json();
      const { plan_id } = body;

      if (!plan_id) {
        return new Response(
          JSON.stringify({ error: 'Missing required field: plan_id' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: result, error: funcError } = await supabase
        .rpc('calculate_accrued_interest', { plan_id });

      if (funcError) {
        throw funcError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          accrued_interest: result,
          plan_id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (method === 'GET') {
      const updateAll = url.searchParams.get('update_all') === 'true';

      if (updateAll) {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          return new Response(
            JSON.stringify({ error: 'Unauthorized' }),
            {
              status: 401,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }

        const { data: updatedCount, error: funcError } = await supabase
          .rpc('update_all_active_plan_interests');

        if (funcError) {
          throw funcError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            updated_count: updatedCount,
            message: `Updated interest for ${updatedCount} active plans`,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const planId = url.searchParams.get('plan_id');

      if (!planId) {
        return new Response(
          JSON.stringify({ error: 'Missing query parameter: plan_id or set update_all=true' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const { data: projected, error: projError } = await supabase
        .rpc('get_plan_projected_return', { plan_id: planId });

      if (projError) {
        throw projError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          projection: projected,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Interest accrual error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
