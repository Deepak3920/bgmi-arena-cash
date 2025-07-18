-- Add new columns to profiles table for organizer/team system
ALTER TABLE public.profiles 
ADD COLUMN user_type TEXT DEFAULT 'team',
ADD COLUMN organizer_code CHAR(4),
ADD COLUMN linked_organizer_id UUID REFERENCES public.profiles(id);

-- Update existing users to have proper user_type (keeping them as teams for now)
UPDATE public.profiles SET user_type = 'team' WHERE user_type IS NULL;

-- Make user_type NOT NULL after setting defaults
ALTER TABLE public.profiles ALTER COLUMN user_type SET NOT NULL;

-- Add check constraint for user_type
ALTER TABLE public.profiles 
ADD CONSTRAINT user_type_check CHECK (user_type IN ('organizer', 'team'));

-- Create index for organizer_code lookups
CREATE INDEX idx_profiles_organizer_code ON public.profiles(organizer_code);

-- Update RLS policies to allow teams to see their organizer's profile
CREATE POLICY "Teams can view their organizer's profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IN (
  SELECT id FROM public.profiles WHERE linked_organizer_id = profiles.id
));

-- Update tournaments RLS to allow teams to only see their organizer's tournaments
DROP POLICY IF EXISTS "Tournaments are viewable by everyone" ON public.tournaments;

CREATE POLICY "Organizers can view all tournaments" 
ON public.tournaments 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'organizer'
  )
);

CREATE POLICY "Teams can view their organizer's tournaments" 
ON public.tournaments 
FOR SELECT 
USING (
  organizer_id IN (
    SELECT linked_organizer_id FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'team'
  )
);

-- Update tournament creation policy to only allow organizers
DROP POLICY IF EXISTS "Users can create tournaments" ON public.tournaments;

CREATE POLICY "Organizers can create tournaments" 
ON public.tournaments 
FOR INSERT 
WITH CHECK (
  auth.uid() = organizer_id AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND user_type = 'organizer'
  )
);