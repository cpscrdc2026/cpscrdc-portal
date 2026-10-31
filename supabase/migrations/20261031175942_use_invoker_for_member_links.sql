-- These RPCs need no elevated database privileges: editor writes are already
-- authorized by the profiles RLS policy. Invoker mode keeps that policy active.
CREATE OR REPLACE FUNCTION public.link_member(target uuid, mid bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
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
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NOT private.is_editor() THEN RETURN; END IF;
  UPDATE public.profiles SET member_id = NULL WHERE member_id = mid;
END;
$function$;

