import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
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
    const { message, context, action, tournamentId, teamDetails, userId } = await req.json();

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Handle specific actions
    if (action === 'register_tournament') {
      return await handleTournamentRegistration(tournamentId, teamDetails, userId);
    }

    if (action === 'get_tournaments') {
      return await getTournamentList();
    }

    if (action === 'get_tournament_details') {
      return await getTournamentDetails(tournamentId);
    }

    // Get current tournaments for context
    const { data: tournaments } = await supabase
      .from('tournaments')
      .select('*')
      .eq('status', 'upcoming')
      .order('start_date', { ascending: true })
      .limit(5);

    const tournamentContext = tournaments ? 
      `Available upcoming tournaments:\n${tournaments.map(t => 
        `- ${t.title} (ID: ${t.id})\n  Entry Fee: ₹${t.entry_fee}\n  Prize Pool: ₹${t.prize_pool}\n  Max Players: ${t.max_players}\n  Current Players: ${t.current_players}\n  Start Date: ${new Date(t.start_date).toLocaleDateString()}\n  Type: ${t.tournament_type}\n`
      ).join('\n')}` : 'No upcoming tournaments available.';

    const systemPrompt = `You are a professional BGMI (PUBG Mobile) tournament assistant with FULL ACCESS to the tournament platform. You can help users with:

1. **Tournament Information**: View and explain tournament details, rules, schedules
2. **Registration Process**: Help users register for tournaments by collecting team details
3. **Payment Processing**: Generate payment QR codes and handle payment confirmation
4. **Slot Management**: Check availability and book tournament slots

IMPORTANT CAPABILITIES:
- You have direct access to the tournament database
- You can process registrations and payments
- You can generate UPI payment QR codes
- You can book tournament slots automatically

REGISTRATION WORKFLOW:
When a user wants to register for a tournament:
1. Ask for tournament preference (show available tournaments)
2. Collect team details (team name, player names, in-game IDs)
3. Confirm entry fee and tournament details
4. Generate payment QR code
5. After payment confirmation, book the slot automatically

Current tournament data:
${tournamentContext}

RESPONSE FORMAT:
- Be conversational and helpful
- Always confirm details before processing payments
- Provide clear step-by-step guidance
- Use structured responses for complex actions

Context: ${context || 'General tournament assistance'}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User message: ${message}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    const aiResponse = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ 
      response: aiResponse,
      tournaments: tournaments || [],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in tournament-ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred while processing your request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getTournamentList() {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify({ 
      tournaments: tournaments || [],
      action: 'tournament_list'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Failed to get tournaments: ${error.message}`);
  }
}

async function getTournamentDetails(tournamentId: string) {
  try {
    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      tournament,
      action: 'tournament_details'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    throw new Error(`Failed to get tournament details: ${error.message}`);
  }
}

async function handleTournamentRegistration(tournamentId: string, teamDetails: any, userId: string) {
  try {
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

    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('user_id', userId)
      .single();

    if (existingRegistration) {
      throw new Error('Already registered for this tournament');
    }

    // Generate UPI payment QR code
    const upiString = `upi://pay?pa=tournament@upi&pn=BGMI Tournament&am=${tournament.entry_fee}&cu=INR&tn=Tournament Registration - ${tournament.title}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiString)}`;

    // Create pending registration
    const { data: registration, error: regError } = await supabase
      .from('tournament_registrations')
      .insert([
        {
          tournament_id: tournamentId,
          user_id: userId,
          team_name: teamDetails.teamName,
          team_members: teamDetails.teamMembers,
          payment_status: 'pending',
          registered_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (regError) throw regError;

    return new Response(JSON.stringify({ 
      action: 'registration_created',
      registration,
      tournament,
      paymentQR: qrCodeUrl,
      upiString,
      message: `Registration created! Please complete payment of ₹${tournament.entry_fee} using the QR code.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }
}