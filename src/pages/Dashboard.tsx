import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Tournament } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import Navbar from '@/components/layout/Navbar'
import TournamentCard from '@/components/tournaments/TournamentCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Trophy, Zap, Clock, TrendingUp } from 'lucide-react'

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('start_date')
  const [filterStatus, setFilterStatus] = useState('all')
  const [registeredTournaments, setRegisteredTournaments] = useState<string[]>([])

  useEffect(() => {
    fetchTournaments()
    if (user) {
      fetchRegisteredTournaments()
    }
  }, [user])

  const fetchTournaments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTournaments(data || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch tournaments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRegisteredTournaments = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tournament_registrations')
        .select('tournament_id')
        .eq('user_id', user.id)
        .eq('payment_status', 'completed')

      if (error) throw error
      setRegisteredTournaments(data?.map(reg => reg.tournament_id) || [])
    } catch (error: any) {
      console.error('Error fetching registrations:', error)
    }
  }

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to join tournaments",
        variant: "destructive",
      })
      return
    }

    try {
      // In a real app, this would integrate with a payment processor
      const { error } = await supabase
        .from('tournament_registrations')
        .insert([
          {
            tournament_id: tournamentId,
            user_id: user.id,
            payment_status: 'completed', // Simulating successful payment
            registered_at: new Date().toISOString(),
          },
        ])

      if (error) throw error

      // Update tournament participant count
      const tournament = tournaments.find(t => t.id === tournamentId)
      if (tournament) {
        const { error: updateError } = await supabase
          .from('tournaments')
          .update({ current_players: tournament.current_players + 1 })
          .eq('id', tournamentId)

        if (updateError) throw updateError
      }

      toast({
        title: "Success!",
        description: "You've successfully joined the tournament!",
      })

      // Refresh data
      fetchTournaments()
      fetchRegisteredTournaments()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const filteredTournaments = tournaments
    .filter(tournament => {
      const matchesSearch = tournament.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           tournament.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || tournament.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'start_date':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case 'prize_pool':
          return b.prize_pool - a.prize_pool
        case 'entry_fee':
          return a.entry_fee - b.entry_fee
        default:
          return 0
      }
    })

  const upcomingTournaments = filteredTournaments.filter(t => t.status === 'upcoming')
  const activeTournaments = filteredTournaments.filter(t => t.status === 'active')
  const myTournaments = filteredTournaments.filter(t => registeredTournaments.includes(t.id))

  const stats = {
    total: tournaments.length,
    upcoming: tournaments.filter(t => t.status === 'upcoming').length,
    active: tournaments.filter(t => t.status === 'active').length,
    registered: registeredTournaments.length,
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              BGMI Tournament Hub
            </span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join competitive PUBG Mobile tournaments, win prizes, and climb the esports ladder
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-card to-muted/20 p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-warning" />
              <span className="text-sm text-muted-foreground">Total Tournaments</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-card to-muted/20 p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Upcoming</span>
            </div>
            <p className="text-2xl font-bold">{stats.upcoming}</p>
          </div>
          <div className="bg-gradient-to-br from-card to-muted/20 p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-success" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-gradient-to-br from-card to-muted/20 p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-secondary" />
              <span className="text-sm text-muted-foreground">My Tournaments</span>
            </div>
            <p className="text-2xl font-bold">{stats.registered}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-input border-border focus:border-primary transition-colors"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-input border-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="start_date">Start Date</SelectItem>
              <SelectItem value="prize_pool">Prize Pool</SelectItem>
              <SelectItem value="entry_fee">Entry Fee</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-48 bg-input border-border">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tournament Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Tournaments</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="my">My Tournaments</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onJoin={handleJoinTournament}
                  isRegistered={registeredTournaments.includes(tournament.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onJoin={handleJoinTournament}
                  isRegistered={registeredTournaments.includes(tournament.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onJoin={handleJoinTournament}
                  isRegistered={registeredTournaments.includes(tournament.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="my" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  onJoin={handleJoinTournament}
                  isRegistered={true}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {filteredTournaments.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No tournaments found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms' : 'Be the first to create a tournament!'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard