import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Bot, Send, MessageCircle, Loader2, Trophy, CreditCard, Users, Calendar } from 'lucide-react'

interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  type?: 'text' | 'tournament_info' | 'payment_qr' | 'registration_success'
  data?: any
}

interface Tournament {
  id: string
  title: string
  entry_fee: number
  prize_pool: number
  max_players: number
  current_players: number
  start_date: string
  tournament_type: string
  description: string | null
}

const TournamentAssistant: React.FC = () => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hi! I'm your BGMI tournament assistant with full platform access. I can help you:\n\n🏆 **View tournaments** - Check available tournaments\n💳 **Register for tournaments** - Complete registration with payment\n📱 **Generate payment QR** - Get UPI payment codes instantly\n🎯 **Book slots automatically** - Confirm your tournament spot\n\nWhat would you like to do today? Ask me to show tournaments, help you register, or ask any questions!\n\n*Note: If no tournaments are currently available, I'll let you know and guide you on creating new ones.*",
      isUser: false,
      timestamp: new Date(),
      type: 'text'
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      isUser: true,
      timestamp: new Date(),
      type: 'text'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke('tournament-ai-assistant', {
        body: { 
          message: userMessage.content,
          context: 'BGMI Tournament Platform - AI assistant with full registration and payment capabilities',
          userId: user?.id
        },
      })

      if (error) throw error

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        type: 'text'
      }

      setMessages(prev => [...prev, aiMessage])

      // Handle special responses with tournament data
      if (data.tournaments && data.tournaments.length > 0) {
        const tournamentListMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: "Available Tournaments",
          isUser: false,
          timestamp: new Date(),
          type: 'tournament_info',
          data: { tournaments: data.tournaments }
        }
        setMessages(prev => [...prev, tournamentListMessage])
      }

      // Handle payment QR response
      if (data.action === 'registration_created' && data.paymentQR) {
        const paymentMessage: Message = {
          id: (Date.now() + 3).toString(),
          content: `Payment Required for ${data.tournament.title}`,
          isUser: false,
          timestamp: new Date(),
          type: 'payment_qr',
          data: {
            tournament: data.tournament,
            paymentQR: data.paymentQR,
            upiString: data.upiString,
            registration: data.registration
          }
        }
        setMessages(prev => [...prev, paymentMessage])
      }

    } catch (error: any) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament)
    const message = `I want to register for "${tournament.title}" tournament. The entry fee is ₹${tournament.entry_fee}.`
    setInput(message)
  }

  const confirmPayment = async (registrationData: any) => {
    try {
      // In a real implementation, you would verify payment here
      // For now, we'll simulate payment confirmation
      const { error } = await supabase
        .from('tournament_registrations')
        .update({ payment_status: 'completed' })
        .eq('id', registrationData.registration.id)

      if (error) throw error

      // Update tournament current players count
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ current_players: registrationData.tournament.current_players + 1 })
        .eq('id', registrationData.tournament.id)

      if (updateError) throw updateError

      const successMessage: Message = {
        id: Date.now().toString(),
        content: `🎉 Registration successful! You've been registered for "${registrationData.tournament.title}". Your slot is confirmed!`,
        isUser: false,
        timestamp: new Date(),
        type: 'registration_success'
      }

      setMessages(prev => [...prev, successMessage])

      toast({
        title: "Payment Confirmed!",
        description: "Your tournament registration is complete.",
      })

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to confirm payment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderMessage = (message: Message) => {
    if (message.type === 'tournament_info' && message.data?.tournaments) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">{message.content}</p>
          <div className="grid gap-3">
            {message.data.tournaments.map((tournament: Tournament) => (
              <div 
                key={tournament.id} 
                className="border border-border/50 rounded-lg p-3 bg-background/50 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleTournamentSelect(tournament)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm">{tournament.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {tournament.tournament_type.toUpperCase()}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    ₹{tournament.entry_fee}
                  </div>
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    ₹{tournament.prize_pool}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {tournament.current_players}/{tournament.max_players}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(tournament.start_date).toLocaleDateString()}
                  </div>
                </div>
                <Button size="sm" className="w-full mt-2" variant="outline">
                  Select Tournament
                </Button>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (message.type === 'payment_qr' && message.data) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">{message.content}</p>
          <div className="border border-border/50 rounded-lg p-4 bg-background/50">
            <div className="text-center space-y-3">
              <div className="text-lg font-bold text-primary">
                ₹{message.data.tournament.entry_fee}
              </div>
              <img 
                src={message.data.paymentQR} 
                alt="Payment QR Code" 
                className="mx-auto w-48 h-48 border rounded-lg"
              />
              <p className="text-xs text-muted-foreground">
                Scan this QR code with any UPI app to pay
              </p>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => navigator.clipboard.writeText(message.data.upiString)}
                >
                  Copy UPI String
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={() => confirmPayment(message.data)}
                >
                  I've Paid
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return <p className="text-sm whitespace-pre-wrap">{message.content}</p>
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gradient-to-br from-card to-muted/20 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-primary" />
          Tournament AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea 
          className="h-96 w-full rounded-md border border-border/50 p-4 bg-background/50"
          ref={scrollAreaRef}
        >
          <div className="space-y-4">
            {messages.map((message) => {
              if (message.type === 'tournament_info' || message.type === 'payment_qr') {
                return (
                  <div
                    key={message.id}
                    className="flex justify-start"
                  >
                    <div className="max-w-[85%] rounded-lg p-3 bg-muted text-foreground border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
                      </div>
                      {renderMessage(message)}
                      <div className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground border border-border/50'
                    }`}
                  >
                    {!message.isUser && (
                      <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
                      </div>
                    )}
                    {renderMessage(message)}
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground border border-border/50 rounded-lg p-3 max-w-[80%]">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground">AI Assistant</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about tournaments, type 'show tournaments' to see all, or tell me you want to register..."
            className="flex-1 bg-input border-border focus:border-primary"
            disabled={isLoading}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!input.trim() || isLoading}
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>🤖 AI Assistant with full tournament access - Register, pay, and book slots instantly!</p>
          <p>Try: "Show me tournaments" or "I want to register for a tournament"</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TournamentAssistant
