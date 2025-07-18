-- Delete existing tournament registrations
DELETE FROM public.tournament_registrations;

-- Delete existing profiles 
DELETE FROM public.profiles;

-- Delete existing tournaments (optional - remove if you want to keep them)
DELETE FROM public.tournaments;