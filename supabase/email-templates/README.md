# Auth email templates

Paste each file into the Supabase dashboard: Authentication > Emails > Templates. Set the subject too.
All use the 6-digit code (`{{ .Token }}`), because the app asks people to type a code, not click a link.

| Template in Supabase | File | Subject |
|---|---|---|
| Confirm sign up | confirm-signup.html | Your Semi Circle code |
| Magic Link | magic-link.html | Your Semi Circle sign-in code |
| Reset Password | reset-password.html | Reset your Semi Circle password |
| Change Email Address | change-email.html | Confirm your new email |
| Reauthentication | reauthentication.html | Confirm it's you |

The acceptance email is not a Supabase template. It is sent by the `send-acceptance` function (see `supabase/functions/`).
