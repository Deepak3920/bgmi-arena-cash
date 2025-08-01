-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organization roles enum
CREATE TYPE public.organization_role AS ENUM ('owner', 'spectator', 'pt_maker', 'room_maker');

-- Create organization members table
CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role organization_role NOT NULL DEFAULT 'spectator',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create team roles enum
CREATE TYPE public.team_role AS ENUM ('team_owner', 'player');

-- Create team members table
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role team_role NOT NULL DEFAULT 'player',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can view organizations they belong to"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners can create organizations"
ON public.organizations
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update their organizations"
ON public.organizations
FOR UPDATE
USING (auth.uid() = owner_id);

-- RLS Policies for organization_members
CREATE POLICY "Users can view organization members of their organizations"
ON public.organization_members
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join organizations"
ON public.organization_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Organization owners can manage members"
ON public.organization_members
FOR ALL
USING (
  organization_id IN (
    SELECT id 
    FROM public.organizations 
    WHERE owner_id = auth.uid()
  )
);

-- RLS Policies for teams
CREATE POLICY "Users can view teams in their organizations"
ON public.teams
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can create teams"
ON public.teams
FOR INSERT
WITH CHECK (
  auth.uid() = owner_id AND
  organization_id IN (
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Team owners can update their teams"
ON public.teams
FOR UPDATE
USING (auth.uid() = owner_id);

-- RLS Policies for team_members
CREATE POLICY "Users can view team members of teams in their organizations"
ON public.team_members
FOR SELECT
USING (
  team_id IN (
    SELECT t.id 
    FROM public.teams t
    JOIN public.organization_members om ON t.organization_id = om.organization_id
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Users can join teams"
ON public.team_members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team owners can manage members"
ON public.team_members
FOR ALL
USING (
  team_id IN (
    SELECT id 
    FROM public.teams 
    WHERE owner_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to remove the old organization/team logic
ALTER TABLE public.profiles DROP COLUMN IF EXISTS user_type;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS organizer_code;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS linked_organizer_id;