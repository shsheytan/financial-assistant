-- ============================================================================
-- Private storage buckets for receipt images and voice notes.
--
-- Both are private. Files are reached through short-lived signed URLs, never a
-- public path — a receipt photo carries a merchant, an amount, a date and
-- sometimes the last digits of a card.
--
-- Object keys are `{user_id}/{uuid}.{ext}`. The policies below enforce that
-- shape, so a user can only touch objects under their own prefix. This is what
-- makes the first path segment trustworthy rather than a naming convention
-- somebody will eventually forget.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'receipts',
    'receipts',
    false,
    5242880, -- 5 MB, matching the client-side compression ceiling
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  ),
  (
    'voice-notes',
    'voice-notes',
    false,
    10485760, -- 10 MB; 60s of Opus or AAC is far below this
    array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav']
  )
on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- Policies. storage.foldername(name) splits the object key on '/', so
-- [1] is the first segment — the owner's user id.
-- ----------------------------------------------------------------------------
create policy "receipts: read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "receipts: upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "receipts: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "voice-notes: read own"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "voice-notes: upload own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "voice-notes: delete own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'voice-notes'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
