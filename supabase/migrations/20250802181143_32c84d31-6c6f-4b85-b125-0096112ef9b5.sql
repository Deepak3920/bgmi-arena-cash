-- Create security definer function to get user type without recursion
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT user_type FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Teams can view their organizer's profile" ON public.profiles;

-- Fix the tournament policies that reference profiles table
DROP POLICY IF EXISTS "Organizers can create tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Organizers can view all tournaments" ON public.tournaments;
DROP POLICY IF EXISTS "Teams can view their organizer's tournaments" ON public.tournaments;

-- Recreate tournament policies using the security definer function
CREATE POLICY "Organizers can create tournaments" ON public.tournaments
    FOR INSERT WITH CHECK (
        auth.uid() = organizer_id AND 
        public.get_current_user_type() = 'organizer'
    );

CREATE POLICY "Organizers can view all tournaments" ON public.tournaments
    FOR SELECT USING (public.get_current_user_type() = 'organizer');

-- Create a security definer function to get linked organizer
CREATE OR REPLACE FUNCTION public.get_current_user_linked_organizer()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT linked_organizer_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE POLICY "Teams can view their organizer's tournaments" ON public.tournaments
    FOR SELECT USING (
        organizer_id = public.get_current_user_linked_organizer() AND
        public.get_current_user_type() = 'team'
    );