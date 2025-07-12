import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { CalendarIcon, Trophy, Users, MapPin, Clock, Gamepad2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface CreateTournamentFormProps {
  onSuccess: () => void
}

const CreateTournamentForm: React.FC<CreateTournamentFormProps> = ({ onSuccess }) => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState<Date>()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    entry_fee: '',
    prize_pool: '',
    max_players: '',
    tournament_type: 'squad' as 'solo' | 'duo' | 'squad',
    map: 'Erangel',
    rules: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a tournament",
        variant: "destructive",
      })
      return
    }

    if (!startDate) {
      toast({
        title: "Error",
        description: "Please select a start date",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const tournamentData = {
        title: formData.title,
        description: formData.description,
        entry_fee: parseInt(formData.entry_fee),
        prize_pool: parseInt(formData.prize_pool),
        max_players: parseInt(formData.max_players),
        current_players: 0,
        start_date: startDate.toISOString(),
        status: 'upcoming' as const,
        organizer_id: user.id,
        tournament_type: formData.tournament_type,
        map: formData.map,
        rules: formData.rules,
      }

      const { error } = await supabase
        .from('tournaments')
        .insert([tournamentData])

      if (error) throw error

      toast({
        title: "Tournament Created!",
        description: "Your tournament has been successfully created.",
      })

      // Reset form
      setFormData({
        title: '',
        description: '',
        entry_fee: '',
        prize_pool: '',
        max_players: '',
        tournament_type: 'squad',
        map: 'Erangel',
        rules: '',
      })
      setStartDate(undefined)
      
      onSuccess()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-gradient-to-br from-card via-card to-muted/20 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <div className="p-2 rounded-full bg-gradient-to-r from-primary to-secondary">
            <Gamepad2 className="h-5 w-5 text-primary-foreground" />
          </div>
          Create New Tournament
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-warning" />
                  Tournament Title
                </Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Epic BGMI Championship"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="bg-input border-border focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your tournament..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="bg-input border-border focus:border-primary transition-colors min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entry_fee">Entry Fee (₹)</Label>
                  <Input
                    id="entry_fee"
                    name="entry_fee"
                    type="number"
                    placeholder="100"
                    value={formData.entry_fee}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="bg-input border-border focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize_pool">Prize Pool (₹)</Label>
                  <Input
                    id="prize_pool"
                    name="prize_pool"
                    type="number"
                    placeholder="5000"
                    value={formData.prize_pool}
                    onChange={handleInputChange}
                    required
                    min="0"
                    className="bg-input border-border focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Max Players
                </Label>
                <Input
                  name="max_players"
                  type="number"
                  placeholder="100"
                  value={formData.max_players}
                  onChange={handleInputChange}
                  required
                  min="2"
                  max="100"
                  className="bg-input border-border focus:border-primary transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  Tournament Type
                </Label>
                <Select value={formData.tournament_type} onValueChange={(value) => handleSelectChange('tournament_type', value)}>
                  <SelectTrigger className="bg-input border-border focus:border-primary transition-colors">
                    <SelectValue placeholder="Select tournament type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                    <SelectItem value="squad">Squad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Map
                </Label>
                <Select value={formData.map} onValueChange={(value) => handleSelectChange('map', value)}>
                  <SelectTrigger className="bg-input border-border focus:border-primary transition-colors">
                    <SelectValue placeholder="Select map" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Erangel">Erangel</SelectItem>
                    <SelectItem value="Sanhok">Sanhok</SelectItem>
                    <SelectItem value="Miramar">Miramar</SelectItem>
                    <SelectItem value="Vikendi">Vikendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-secondary" />
                  Start Date & Time
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-input border-border",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Tournament Rules</Label>
            <Textarea
              id="rules"
              name="rules"
              placeholder="Enter tournament rules and regulations..."
              value={formData.rules}
              onChange={handleInputChange}
              required
              className="bg-input border-border focus:border-primary transition-colors min-h-[120px]"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 shadow-lg"
            disabled={loading}
          >
            {loading ? 'Creating Tournament...' : 'Create Tournament'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default CreateTournamentForm