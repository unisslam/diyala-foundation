-- Migration: RBAC and Membership Enhancements
-- Applied on 2026-09-11

-- 1. Fix foreign key constraint on team_members to ON DELETE SET NULL
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_membership_application_id_fkey;

ALTER TABLE public.team_members
ADD CONSTRAINT team_members_membership_application_id_fkey
FOREIGN KEY (membership_application_id)
REFERENCES public.membership_applications(id)
ON DELETE SET NULL;

-- 2. Add membership tracking fields to team_members
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS membership_number TEXT,
ADD COLUMN IF NOT EXISTS membership_start_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS membership_expires_at DATE,
ADD COLUMN IF NOT EXISTS membership_tier TEXT DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 100;

-- 3. Create member_activities table for logging workshops, tasks, events, and performance
CREATE TABLE IF NOT EXISTS public.member_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL DEFAULT 'workshop',
    title TEXT NOT NULL,
    description TEXT,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    hours_spent NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.member_activities ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'member_activities' AND policyname = 'member_activities: admin full access'
    ) THEN
        CREATE POLICY "member_activities: admin full access"
        ON public.member_activities
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 4. Create admin_profiles table for RBAC
CREATE TABLE IF NOT EXISTS public.admin_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'custom',
    permissions JSONB NOT NULL DEFAULT '{
        "can_manage_news": false,
        "can_manage_projects": false,
        "can_manage_memberships": false,
        "can_manage_team": false,
        "can_manage_messages": false,
        "can_manage_gallery": false,
        "can_manage_admins": false
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'admin_profiles' AND policyname = 'admin_profiles: authenticated full access'
    ) THEN
        CREATE POLICY "admin_profiles: authenticated full access"
        ON public.admin_profiles
        FOR ALL
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Create helper security function
CREATE OR REPLACE FUNCTION public.has_admin_permission(user_id UUID, perm_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role TEXT;
    v_active BOOLEAN;
    v_perms JSONB;
BEGIN
    SELECT role, is_active, permissions
    INTO v_role, v_active, v_perms
    FROM public.admin_profiles
    WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN true;
    END IF;

    IF v_active IS NOT TRUE THEN
        RETURN false;
    END IF;

    IF v_role = 'super_admin' THEN
        RETURN true;
    END IF;

    IF v_perms ? perm_name AND (v_perms->>perm_name)::boolean = true THEN
        RETURN true;
    END IF;

    RETURN false;
END;
$$;

-- 6. Seed existing admin users into admin_profiles as super_admin
INSERT INTO public.admin_profiles (id, full_name, role, permissions, is_active)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'full_name', email, 'مشرف النظام'),
    'super_admin',
    '{
        "can_manage_news": true,
        "can_manage_projects": true,
        "can_manage_memberships": true,
        "can_manage_team": true,
        "can_manage_messages": true,
        "can_manage_gallery": true,
        "can_manage_admins": true
    }'::jsonb,
    true
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    role = 'super_admin',
    is_active = true,
    permissions = '{
        "can_manage_news": true,
        "can_manage_projects": true,
        "can_manage_memberships": true,
        "can_manage_team": true,
        "can_manage_messages": true,
        "can_manage_gallery": true,
        "can_manage_admins": true
    }'::jsonb;

-- Link existing team_member to admin_profile if email matches
UPDATE public.admin_profiles ap
SET team_member_id = tm.id
FROM public.team_members tm, auth.users u
WHERE u.id = ap.id AND tm.email = u.email;

-- 7. Update sync_membership_to_team_member trigger
CREATE OR REPLACE FUNCTION public.sync_membership_to_team_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
            membership_application_id,
            membership_number,
            membership_start_date,
            membership_expires_at,
            membership_tier,
            activity_score
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
            NEW.id,
            NEW.application_number,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 year',
            NEW.membership_type::text,
            100
        )
        ON CONFLICT (membership_application_id) 
        DO UPDATE SET 
            is_active = true, 
            role = 'member'::public.team_role,
            membership_number = NEW.application_number,
            membership_tier = NEW.membership_type::text;

    ELSIF NEW.status != 'approved' AND OLD.status = 'approved' THEN
        UPDATE public.team_members
        SET is_active = false
        WHERE membership_application_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;
