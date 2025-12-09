-- 1. Enable the pg_cron extension (Run this in SQL Editor)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Schedule the Edge Function to run every 5 minutes
-- REPLACE [YOUR_PROJECT_REF] and [YOUR_ANON_KEY] with actual values
-- You can find Project Ref in your project URL (https://supabase.com/dashboard/project/[PROJECT_REF])
-- You can find Anon Key in Settings > API

select cron.schedule(
    'sync-ifood-every-5-minutes', -- Job name
    '*/1 * * * *',                -- Schedule (Every 1 min)
    $$
    select
        net.http_post(
            -- URL of your Edge Function
            -- 'https://ifmmqlccvwniiwhxbsau.supabase.co/functions/v1/sync-ifood',
            -- OR if using local dev, this won't work directly without ngrok.
            -- This is for PRODUCTION.
            url:='https://ifmmqlccvwniiwhxbsau.supabase.co/functions/v1/sync-ifood',
            
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmbW1xbGNjdnduaWl3aHhic2F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxOTMwMTQsImV4cCI6MjA3OTc2OTAxNH0.LQ877b6-z9UgZ2l1XJxnalXs_mnf9HFm_dX7WHktJGo"}'::jsonb,
            
            body:='{}'::jsonb
        ) as request_id;
    $$
);

/*
    -- To check if it's running:
    select * from cron.job_run_details order by start_time desc;

    -- To unschedule:
    select cron.unschedule('sync-ifood-every-5-minutes');
*/
