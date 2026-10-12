# Auth email templates

Paste each file into the Supabase dashboard: Authentication > Emails > Templates. Set the subject too.
All use the 6-digit code (`{{ .Token }}`), because the app asks people to type a code, not click a link.

| Template in Supabase | File | Subject |
|---|---|---|
| Confirm sign up | confirm-signup.html | Your Semi Circle code, as requested |
| Magic Link | magic-link.html | Your sign-in code, fresh out of the oven |
| Reset Password | reset-password.html | Forgot your password? Happens. |
| Change Email Address | change-email.html | New email, who dis? |
| Reauthentication | reauthentication.html | Just checking it is you |

The acceptance email is not a Supabase template. It is sent by the `send-acceptance` function (see `supabase/functions/`).
