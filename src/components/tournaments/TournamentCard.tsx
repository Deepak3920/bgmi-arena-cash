import React from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tournament } from '@/lib/supabase'
import { Calendar, Users, Trophy, MapPin, Clock } from 'lucide-react'

interface TournamentCardProps {
  tournament: Tournament
  onJoin: (tournamentId: string) => void
  isRegistered?: boolean
}

const TournamentCard: React.FC<TournamentCardProps> = ({ 
  tournament, 
  onJoin, 
  isRegistered = false 
}) => {
  const getStatusColor = (status: Tournament['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-warning text-warning-foreground'
      case 'active':
        return 'bg-success text-success-foreground'
      case 'completed':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const spotsLeft = tournament.max_players - tournament.current_players

  return (
    <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-bold text-foreground line-clamp-1">
            {tournament.title}
          </CardTitle>
          <Badge className={getStatusColor(tournament.status)}>
            {tournament.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {tournament.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-warning" />
            <span className="text-muted-foreground">Prize:</span>
            <span className="font-semibold text-warning">₹{tournament.prize_pool}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Entry:</span>
            <span className="font-semibold text-primary">₹{tournament.entry_fee}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-secondary" />
            <span className="text-muted-foreground">Start:</span>
            <span className="font-medium">{formatDate(tournament.start_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">Map:</span>
            <span className="font-medium">{tournament.map}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Type:</span>
            <Badge variant="outline" className="text-xs">
              {tournament.tournament_type.toUpperCase()}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Players</span>
            <span className="font-medium">
              {tournament.current_players}/{tournament.max_players}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(tournament.current_players / tournament.max_players) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Tournament full'}
          </p>
        </div>
      </CardContent>

      <CardFooter>
        {isRegistered ? (
          <Button className="w-full" variant="outline" disabled>
            Already Registered
          </Button>
        ) : tournament.status === 'completed' ? (
          <Button className="w-full" variant="outline" disabled>
            Tournament Ended
          </Button>
        ) : spotsLeft === 0 ? (
          <Button className="w-full" variant="outline" disabled>
            Tournament Full
          </Button>
        ) : (
          <Button 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg"
            onClick={() => onJoin(tournament.id)}
          >
            Join Tournament - ₹{tournament.entry_fee}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default TournamentCard