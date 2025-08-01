import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  User, 
  Mail, 
  Gamepad2, 
  Trophy, 
  Target, 
  Coins, 
  Edit2, 
  Save, 
  X,
  LogOut,
  Shield
} from 'lucide-react'

const Profile = () => {
  const { user, profile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    username: profile?.username || '',
    in_game_name: profile?.in_game_name || '',
  })

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData({
        username: profile?.username || '',
        in_game_name: profile?.in_game_name || '',
      })
    }
    setIsEditing(!isEditing)
  }

  const handleSave = async () => {
    try {
      await updateProfile(editData)
      setIsEditing(false)
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user || !profile) {
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
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Profile Settings
            </span>
          </h1>
          <p className="text-muted-foreground">Manage your account and gaming profile</p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-to-br from-card to-muted/20 border-border/50">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 border-4 border-primary/50">
                    <AvatarImage src={profile.avatar_url} alt={profile.username} />
                    <AvatarFallback className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-2xl">
                      {profile.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{profile.username}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  <Gamepad2 className="h-4 w-4" />
                  {profile.in_game_name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Trophy className="h-4 w-4 text-warning" />
                      <span className="text-xs text-muted-foreground">Level</span>
                    </div>
                    <p className="text-lg font-bold">{profile.level}</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="h-4 w-4 text-success" />
                      <span className="text-xs text-muted-foreground">Wins</span>
                    </div>
                    <p className="text-lg font-bold">{profile.wins}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Matches</span>
                    <span className="font-medium">{profile.total_matches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Win Rate</span>
                    <span className="font-medium">
                      {profile.total_matches > 0 
                        ? `${Math.round((profile.wins / profile.total_matches) * 100)}%` 
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Coins className="h-4 w-4 text-warning" />
                      Earnings
                    </span>
                    <span className="font-medium text-warning">₹{profile.earnings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information */}
            <Card className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal and gaming details
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isEditing ? handleEditToggle : handleEditToggle}
                  className="flex items-center gap-2"
                >
                  {isEditing ? (
                    <>
                      <X className="h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <Badge variant="outline" className="text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={isEditing ? editData.username : profile.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    disabled={!isEditing}
                    className={isEditing ? '' : 'bg-muted'}
                  />
                </div>

                {/* In-Game Name */}
                <div className="space-y-2">
                  <Label htmlFor="in_game_name">BGMI In-Game Name</Label>
                  <Input
                    id="in_game_name"
                    type="text"
                    value={isEditing ? editData.in_game_name : profile.in_game_name}
                    onChange={(e) => setEditData({ ...editData, in_game_name: e.target.value })}
                    disabled={!isEditing}
                    className={isEditing ? '' : 'bg-muted'}
                  />
                </div>

                {isEditing && (
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSave}
                      className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={handleEditToggle}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>
                  Manage your account settings and session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    Back to Dashboard
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile