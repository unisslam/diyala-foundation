-- Migration: Create public membership verification RPC function
-- Allows public verification of membership cards via QR code without exposing private data

CREATE OR REPLACE FUNCTION public.verify_membership(search_identifier text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    cleaned_id text;
    v_member record;
    v_app record;
    v_act_count integer := 0;
    v_status text := 'not_found';
    v_is_valid boolean := false;
    v_result json;
BEGIN
    cleaned_id := TRIM(COALESCE(search_identifier, ''));

    IF cleaned_id = '' THEN
        RETURN json_build_object(
            'is_valid', false,
            'status', 'not_found',
            'message', 'رمز أو رقم العضوية غير محدد'
        );
    END IF;

    -- 1. Try finding in team_members:
    -- Match by membership_number, or id (if uuid), or DRF-MEM-(first 6 chars of id), or application_id
    SELECT * INTO v_member
    FROM public.team_members
    WHERE 
        LOWER(TRIM(COALESCE(membership_number, ''))) = LOWER(cleaned_id)
        OR (
            cleaned_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND id = cleaned_id::uuid
        )
        OR UPPER('DRF-MEM-' || SUBSTRING(id::text, 1, 6)) = UPPER(cleaned_id)
        OR (
            membership_application_id IS NOT NULL 
            AND membership_application_id IN (
                SELECT a.id FROM public.membership_applications a 
                WHERE LOWER(TRIM(COALESCE(a.application_number, ''))) = LOWER(cleaned_id)
            )
        )
    ORDER BY 
        CASE WHEN LOWER(TRIM(COALESCE(membership_number, ''))) = LOWER(cleaned_id) THEN 1 ELSE 2 END,
        created_at DESC
    LIMIT 1;

    -- If found in team_members
    IF v_member.id IS NOT NULL THEN
        -- Check workshops/activities count
        SELECT COUNT(*) INTO v_act_count 
        FROM public.member_activities 
        WHERE team_member_id = v_member.id;

        -- Determine status
        IF v_member.membership_expires_at IS NOT NULL AND v_member.membership_expires_at < CURRENT_DATE THEN
            v_status := 'expired';
            v_is_valid := true; -- record exists but expired
        ELSIF v_member.is_active = false THEN
            v_status := 'inactive_suspended';
            v_is_valid := true; -- record exists but inactive
        ELSE
            v_status := 'valid_active';
            v_is_valid := true;
        END IF;

        RETURN json_build_object(
            'is_valid', v_is_valid,
            'status', v_status,
            'member_id', v_member.id,
            'membership_number', COALESCE(v_member.membership_number, 'DRF-MEM-' || UPPER(SUBSTRING(v_member.id::text, 1, 6))),
            'full_name_ar', v_member.full_name_ar,
            'full_name_en', v_member.full_name_en,
            'title_ar', COALESCE(v_member.title_ar, 'عضو المؤسسة'),
            'title_en', COALESCE(v_member.title_en, 'Foundation Member'),
            'role', v_member.role,
            'membership_tier', COALESCE(v_member.membership_tier, 'regular'),
            'avatar_path', v_member.avatar_path,
            'membership_start_date', COALESCE(v_member.membership_start_date, v_member.created_at::date),
            'membership_expires_at', v_member.membership_expires_at,
            'activity_score', COALESCE(v_member.activity_score, 100),
            'workshops_count', v_act_count,
            'bio_ar', v_member.bio_ar,
            'is_active', v_member.is_active,
            'verified_at', NOW()
        );
    END IF;

    -- 2. Fallback: Check if application exists and is approved
    SELECT * INTO v_app
    FROM public.membership_applications
    WHERE 
        LOWER(TRIM(COALESCE(application_number, ''))) = LOWER(cleaned_id)
        OR (
            cleaned_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            AND id = cleaned_id::uuid
        )
    LIMIT 1;

    IF v_app.id IS NOT NULL THEN
        IF v_app.status = 'approved' THEN
            RETURN json_build_object(
                'is_valid', true,
                'status', 'valid_active',
                'membership_number', COALESCE(REPLACE(v_app.application_number, 'DRF-APP-', 'DRF-MEM-'), 'DRF-MEM-' || UPPER(SUBSTRING(v_app.id::text, 1, 6))),
                'full_name_ar', v_app.full_name_ar,
                'full_name_en', v_app.full_name_en,
                'title_ar', 'عضو معتمد',
                'title_en', 'Approved Member',
                'role', 'member',
                'membership_tier', v_app.membership_type,
                'avatar_path', NULL,
                'membership_start_date', v_app.created_at::date,
                'membership_expires_at', NULL,
                'activity_score', 100,
                'workshops_count', 0,
                'bio_ar', COALESCE(v_app.skills_description, v_app.motivation_statement),
                'is_active', true,
                'verified_at', NOW()
            );
        ELSE
            RETURN json_build_object(
                'is_valid', false,
                'status', 'application_' || v_app.status,
                'membership_number', v_app.application_number,
                'full_name_ar', v_app.full_name_ar,
                'message', 'طلب العضوية ما زال قيد الإجراء ولم يتم اعتماده كعضوية رسمية حتى الآن'
            );
        END IF;
    END IF;

    -- 3. Not found
    RETURN json_build_object(
        'is_valid', false,
        'status', 'not_found',
        'message', 'لم يتم العثور على أي سجل عضوية مطابق لهذا الرقم في السجلات الرسمية لمؤسسة نهر ديالى'
    );
END;
$$;

-- Grant execution to public and authenticated users
GRANT EXECUTE ON FUNCTION public.verify_membership(text) TO anon, authenticated, service_role;
