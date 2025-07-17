import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://khffmkbqvcppybpdrusi.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoZmZta2JxdmNwcHlicGRydXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNDI3ODUsImV4cCI6MjA2NzkxODc4NX0.o4UWa-3ANjYBIsQjGcq9BUuaytSpSwBdraLTvpM6Pps'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Tournament {
  id: string
  title: string
  description: string | null
  entry_fee: number
  prize_pool: number
  max_players: number
  current_players: number
  start_date: string
  status: 'upcoming' | 'active' | 'completed'
  organizer_id: string
  created_at: string
  tournament_type: 'solo' | 'duo' | 'squad'
  map: string | null
  rules: string | null
}

export interface UserProfile {
  id: string
  username: string
  email: string
  in_game_name: string
  level: number
  wins: number
  total_matches: number
  earnings: number
  avatar_url?: string
  created_at: string
}

export interface TournamentRegistration {
  id: string
  tournament_id: string
  user_id: string
  team_name?: string
  team_members?: string[]
  registered_at: string
  payment_status: 'pending' | 'completed' | 'failed'
}