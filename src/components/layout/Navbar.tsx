import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { Gamepad2, Trophy, Plus, User, LogOut, Coins } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Tournaments', icon: Trophy },
  ]

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const clearSession = async () => {
    // Force clear all local storage and sign out
    localStorage.clear()
    sessionStorage.clear()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="p-2 rounded-full bg-gradient-to-r from-primary to-secondary">
              <Gamepad2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BGMI Hub
              </span>
              <span className="text-xs text-muted-foreground -mt-1">Tournament Platform</span>
            </div>
          </div>

          {/* Navigation */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? "default" : "ghost"}
                    onClick={() => navigate(item.path)}
                    className={`flex items-center gap-2 ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg' 
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
          )}

          {/* User Menu */}
          {user && profile ? (
            <div className="flex items-center gap-4">
              {/* Earnings Display */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-warning/20 to-warning/10 border border-warning/30">
                <Coins className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">₹{profile.earnings}</span>
              </div>

              {/* Profile Name - Clickable */}
              <Button
                variant="ghost"
                onClick={() => navigate('/profile')}
                className="hidden md:flex items-center gap-2 hover:bg-muted/50 px-3 py-2 h-auto"
              >
                <span className="text-sm font-medium">{profile.username}</span>
              </Button>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary/50">
                      <AvatarImage src={profile.avatar_url} alt={profile.username} />
                      <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                        {profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none">{profile.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {profile.in_game_name}
                    </p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                      <span>Level {profile.level}</span>
                      <span>{profile.wins} Wins</span>
                      <span>{profile.total_matches} Matches</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={clearSession} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Clear Session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              onClick={() => navigate('/login')}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300"
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar