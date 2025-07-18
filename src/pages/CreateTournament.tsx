import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import CreateTournamentForm from '@/components/tournaments/CreateTournamentForm'
import { Shield, Crown } from 'lucide-react'

const CreateTournament = () => {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="p-4 rounded-full bg-destructive/20 w-fit mx-auto mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to create tournaments.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-2 rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (profile?.user_type !== 'organizer') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="p-4 rounded-full bg-warning/20 w-fit mx-auto mb-4">
              <Crown className="h-8 w-8 text-warning" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Organizer Access Required</h1>
            <p className="text-muted-foreground mb-6">
              Only tournament organizers can create tournaments. You are currently registered as a team player.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-primary to-secondary text-primary-foreground px-6 py-2 rounded-lg hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleSuccess = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <CreateTournamentForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}

export default CreateTournament