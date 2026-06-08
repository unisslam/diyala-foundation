CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  ip_address text NOT NULL,
  action text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  PRIMARY KEY (ip_address, action)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.enforce_rate_limit()
RETURNS trigger AS $$
DECLARE
  client_ip text;
  action_name text;
  max_reqs integer;
  time_window interval;
  current_count integer;
BEGIN
  -- Get IP address. Using Cloudflare's header since user is behind CF.
  client_ip := coalesce(
    current_setting('request.headers', true)::json->>'cf-connecting-ip',
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    'unknown'
  );

  -- Admin actions bypassing PostgREST might be unknown, but let's just pass them
  IF client_ip = 'unknown' THEN
    RETURN NEW;
  END IF;

  action_name := TG_ARGV[0];
  max_reqs := TG_ARGV[1]::integer;
  time_window := TG_ARGV[2]::interval;

  -- Clean up old limit if window expired
  DELETE FROM public.api_rate_limits
  WHERE ip_address = client_ip AND action = action_name AND window_start < now() - time_window;

  -- Insert or increment
  INSERT INTO public.api_rate_limits (ip_address, action, request_count, window_start)
  VALUES (client_ip, action_name, 1, now())
  ON CONFLICT (ip_address, action) DO UPDATE
  SET request_count = public.api_rate_limits.request_count + 1
  RETURNING request_count INTO current_count;

  IF current_count > max_reqs THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to the 3 public tables: 5 requests per 1 hour
DROP TRIGGER IF EXISTS rate_limit_contact ON public.contact_messages;
CREATE TRIGGER rate_limit_contact
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rate_limit('contact_messages', '5', '1 hour');

DROP TRIGGER IF EXISTS rate_limit_volunteer ON public.volunteer_applications;
CREATE TRIGGER rate_limit_volunteer
  BEFORE INSERT ON public.volunteer_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rate_limit('volunteer_applications', '5', '1 hour');

DROP TRIGGER IF EXISTS rate_limit_membership ON public.membership_applications;
CREATE TRIGGER rate_limit_membership
  BEFORE INSERT ON public.membership_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_rate_limit('membership_applications', '5', '1 hour');
