-- Keep all existing profile roles intact. New public signups are requests only.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  nm text;
BEGIN
  nm := coalesce(
    nullif(new.raw_user_meta_data->>'display_name', ''),
    split_part(new.email, '@', 1)
  );
  INSERT INTO public.profiles (id, email, username, display_name, role)
  VALUES (new.id, new.email, new.email, nm, 'pending');
  RETURN new;
END;
$function$;

-- Authorization helpers live outside PostgREST's exposed public schema.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_editor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'editor'
  );
$function$;

CREATE OR REPLACE FUNCTION private.is_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('member', 'editor')
  );
$function$;

REVOKE ALL ON FUNCTION private.is_editor() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.is_member() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.is_editor() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_member() TO authenticated;

-- Keep the browser-called RPCs available to signed-in users only; each RPC
-- independently verifies that the caller is an editor.
CREATE OR REPLACE FUNCTION public.link_member(target uuid, mid bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT private.is_editor() THEN RETURN false; END IF;
  UPDATE public.profiles SET member_id = mid WHERE id = target;
  RETURN true;
END;
$function$;

CREATE OR REPLACE FUNCTION public.unlink_member(mid bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT private.is_editor() THEN RETURN; END IF;
  UPDATE public.profiles SET member_id = NULL WHERE member_id = mid;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.link_member(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unlink_member(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.link_member(uuid, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlink_member(bigint) TO authenticated;

-- These old public helpers are no longer referenced by policies or the client.
REVOKE ALL ON FUNCTION public.has_member_access() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_editor() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_member() FROM PUBLIC, anon, authenticated;

ALTER TABLE public.portal_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit for editors" ON public.portal_state;
DROP POLICY IF EXISTS "editors insert" ON public.portal_state;
DROP POLICY IF EXISTS "editors insert state" ON public.portal_state;
DROP POLICY IF EXISTS "editors read audit" ON public.portal_state;
DROP POLICY IF EXISTS "editors update" ON public.portal_state;
DROP POLICY IF EXISTS "editors update state" ON public.portal_state;
DROP POLICY IF EXISTS "members read scripts" ON public.portal_state;
DROP POLICY IF EXISTS "public read" ON public.portal_state;
DROP POLICY IF EXISTS "public state readable" ON public.portal_state;
DROP POLICY IF EXISTS "scripts for members" ON public.portal_state;

CREATE POLICY portal_state_anon_read
  ON public.portal_state FOR SELECT TO anon
  USING (key = 'public');

CREATE POLICY portal_state_authenticated_read
  ON public.portal_state FOR SELECT TO authenticated
  USING (
    key = 'public'
    OR (key = 'scripts' AND (SELECT private.is_member()))
    OR (key = 'audit' AND (SELECT private.is_editor()))
  );

CREATE POLICY portal_state_editor_insert
  ON public.portal_state FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_editor()));

CREATE POLICY portal_state_editor_update
  ON public.portal_state FOR UPDATE TO authenticated
  USING ((SELECT private.is_editor()))
  WITH CHECK ((SELECT private.is_editor()));

DROP POLICY IF EXISTS "editors update profiles" ON public.profiles;
DROP POLICY IF EXISTS "read own or all if editor" ON public.profiles;
DROP POLICY IF EXISTS "read profiles" ON public.profiles;

CREATE POLICY profiles_read_own_or_editor
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT private.is_editor()));

CREATE POLICY profiles_editor_update
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT private.is_editor()))
  WITH CHECK ((SELECT private.is_editor()));

