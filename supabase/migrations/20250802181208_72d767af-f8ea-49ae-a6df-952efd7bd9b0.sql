-- Fix security definer functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_type()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN (SELECT user_type FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_linked_organizer()
RETURNS UUID 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
STABLE
AS $$
BEGIN
  RETURN (SELECT linked_organizer_id FROM public.profiles WHERE id = auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;