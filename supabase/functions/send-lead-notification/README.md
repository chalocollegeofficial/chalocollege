# send-lead-notification (SMTP)

Supabase Edge Function that emails new leads using **your own SMTP server** instead of Supabase's built‑in mail setup.

## Required secrets
Set these in your project (replace values with your SMTP details):

```
supabase secrets set \
  SMTP_HOST=smtp.yourhost.com \
  SMTP_PORT=587 \
  SMTP_USER=your_user \
  SMTP_PASS=your_password \
  SMTP_FROM="Leads <noreply@yourdomain.com>" \
  SMTP_TO=alerts@yourdomain.com \
  SMTP_SECURE=false
```

`SMTP_SECURE=true` is recommended when using port 465.

## Deploy
```
supabase functions deploy send-lead-notification --project-ref <your-project-ref>
```

## How it is used
Front-end calls `notifyAdminNewLead` (already wired) → invokes this function with the inserted lead row → this function sends mail via your SMTP. No changes needed in the React code after deployment.
