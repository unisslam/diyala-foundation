-- Migration: Auto create team members from approved membership applications

-- 1. Add "member" to team_role (Postgres 12+ supports IF NOT EXISTS)
ALTER TYPE public.team_role ADD VALUE IF NOT EXISTS 'member';

-- 2. Add membership_application_id to team_members
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS membership_application_id UUID REFERENCES public.membership_applications(id);

-- Add UNIQUE constraint to membership_application_id to prevent duplicates
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_members_membership_application_id_key'
    ) THEN
        ALTER TABLE public.team_members ADD CONSTRAINT team_members_membership_application_id_key UNIQUE (membership_application_id);
    END IF;
END $$;

-- 3. Create the sync function
CREATE OR REPLACE FUNCTION public.sync_membership_to_team_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- If status changed TO 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.team_members (
            id,
            full_name_ar,
            full_name_en,
            role,
            title_ar,
            title_en,
            bio_ar,
            bio_en,
            email,
            display_order,
            is_active,
            membership_application_id
        ) VALUES (
            gen_random_uuid(),
            NEW.full_name_ar,
            NEW.full_name_en,
            'member'::public.team_role,
            COALESCE(NEW.current_position, 'عضو'),
            COALESCE(NEW.current_position, 'Member'),
            COALESCE(NEW.expertise_description, NEW.motivation_statement),
            COALESCE(NEW.expertise_description, NEW.motivation_statement),
            NEW.email,
            (SELECT COALESCE(MAX(display_order), 0) + 1 FROM public.team_members),
            true,
            NEW.id
        )
        ON CONFLICT (membership_application_id) 
        DO UPDATE SET 
            is_active = true, 
            role = 'member'::public.team_role;

    -- If status changed FROM 'approved' to something else (e.g. rejected or revoked)
    ELSIF NEW.status != 'approved' AND OLD.status = 'approved' THEN
        UPDATE public.team_members
        SET is_active = false
        WHERE membership_application_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

-- 4. Create the trigger
DROP TRIGGER IF EXISTS trg_sync_membership_to_team_member ON public.membership_applications;
CREATE TRIGGER trg_sync_membership_to_team_member
AFTER UPDATE ON public.membership_applications
FOR EACH ROW
EXECUTE FUNCTION public.sync_membership_to_team_member();
