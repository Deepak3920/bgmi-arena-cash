import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase client with service role for database access
const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
  auth: { persistSession: false }
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationId, tournamentId, paymentProof } = await req.json();

    if (!registrationId || !tournamentId) {
      throw new Error('Registration ID and Tournament ID are required');
    }

    // Get registration details
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (regError) throw regError;
    if (!registration) throw new Error('Registration not found');

    // Get tournament details
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;
    if (!tournament) throw new Error('Tournament not found');

    // Check if tournament is full
    if (tournament.current_players >= tournament.max_players) {
      throw new Error('Tournament is full');
    }

    // Update registration status to completed
    const { error: updateError } = await supabase
      .from('tournament_registrations')
      .update({ 
        payment_status: 'completed',
        registered_at: new Date().toISOString()
      })
      .eq('id', registrationId);

    if (updateError) throw updateError;

    // Update tournament current players count
    const { error: tournamentUpdateError } = await supabase
      .from('tournaments')
      .update({ current_players: tournament.current_players + 1 })
      .eq('id', tournamentId);

    if (tournamentUpdateError) throw tournamentUpdateError;

    // Log the payment confirmation (in a real app, you might store payment proof)
    console.log(`Payment confirmed for registration ${registrationId}, tournament ${tournamentId}`);
    if (paymentProof) {
      console.log(`Payment proof: ${paymentProof}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Payment confirmed and registration completed',
      registration: {
        ...registration,
        payment_status: 'completed'
      },
      tournament: {
        ...tournament,
        current_players: tournament.current_players + 1
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in payment confirmation:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'An error occurred while confirming payment'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});