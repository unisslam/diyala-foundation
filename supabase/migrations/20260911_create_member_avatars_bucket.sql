-- Migration: Create member-avatars storage bucket for approved members
-- Applied on 2026-09-11

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'member-avatars',
    'member-avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies for member-avatars
DO $$
BEGIN
    -- Public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_avatars_public_read'
    ) THEN
        CREATE POLICY "member_avatars_public_read"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'member-avatars');
    END IF;

    -- Authenticated upload
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_avatars_admin_insert'
    ) THEN
        CREATE POLICY "member_avatars_admin_insert"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'member-avatars');
    END IF;

    -- Authenticated update
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_avatars_admin_update'
    ) THEN
        CREATE POLICY "member_avatars_admin_update"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'member-avatars')
        WITH CHECK (bucket_id = 'member-avatars');
    END IF;

    -- Authenticated delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'member_avatars_admin_delete'
    ) THEN
        CREATE POLICY "member_avatars_admin_delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'member-avatars');
    END IF;

    -- Also ensure team bucket has admin upload policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'team_admin_insert'
    ) THEN
        CREATE POLICY "team_admin_insert"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'team');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'team_admin_delete'
    ) THEN
        CREATE POLICY "team_admin_delete"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'team');
    END IF;
END $$;
