import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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

    const { data: updatedCount, error: funcError } = await supabase
      .rpc('update_all_active_plan_interests');

    if (funcError) {
      throw funcError;
    }

    const { data: activePlans, error: plansError } = await supabase
      .from('savings_plans')
      .select('id, user_id, principal_amount, accrued_interest, mature_date')
      .eq('status', 'active')
      .lte('mature_date', new Date().toISOString());

    if (!plansError && activePlans && activePlans.length > 0) {
      for (const plan of activePlans) {
        const { error: updateError } = await supabase
          .from('savings_plans')
          .update({
            status: 'matured',
            updated_at: new Date().toISOString()
          })
          .eq('id', plan.id);

        if (updateError) {
          continue;
        }
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      updated_plans: updatedCount,
      matured_plans: activePlans?.length || 0,
      message: `Successfully updated interest for ${updatedCount} active plans and matured ${activePlans?.length || 0} plans`,
    };

    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
