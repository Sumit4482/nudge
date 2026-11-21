# Proof wall setup (about 10 minutes)

1. Create a free project at https://supabase.com.
2. Open **SQL editor**, paste `migrations/001_proofs.sql`, run it.
3. **Authentication → Providers → Email**: keep email on, turn **off** "Allow new users to sign up" after step 4.
4. **Authentication → Users → Add user → Create new user**: your own email and a password you choose, with "Auto confirm user" ticked. This is the only account that can ever post. No email or SMTP setup is needed.
5. **Project settings → API**: copy the Project URL and the `anon` public key into `.env` at the project root (see `.env.example`), then restart the app.
6. In the app: **You → Settings → Proof wall**: enter that email and password, tap Sign in.
7. The website in `web/` reads the same project. Put the same two values in `web/.env.local` (see `web/.env.example`).

Privacy: proofs are private until you flip **Show on my proof wall** on a proof. Posts appear after the delay you set (default 30 minutes). Photos are re-saved before upload, which removes location data. Bills and voice notes can never be posted.

## Cheers, names and phone notifications

Run `migrations/002_cheers.sql`, then `migrations/003_push.sql`, in the SQL editor.

- Visitors can leave an optional name when they cheer. Limits are enforced in the database: one cheer per minute per visitor, 60 per hour in total.
- You see who cheered on the **You** tab in the app (a "Cheers" card, with NEW marked). Only the signed-in owner can read the list. Visitors cannot.
- A push notification ("Priya cheered you on") is sent through Expo's push service when a cheer arrives.

### Turning on push (needs a development or production build)

Expo Go cannot receive push on Android, so this works only in a real build. The app registers your phone's push token on its own once you are signed in; there is nothing to paste.

1. Create a free project at https://console.firebase.google.com and add an **Android app** with package name `com.nudge.app`.
2. Download `google-services.json` and save it in the project root.
3. In Firebase: Project settings, Service accounts, **Generate new private key**. Upload that key to EAS: `npx eas-cli credentials`, Android, Google Service Account, FCM V1.
4. Add `"googleServicesFile": "./google-services.json"` under `android` in `app.json`.
5. Build: `npx eas-cli build --profile development --platform android`, install it, open the app, sign in to the proof wall.
6. Test: send a cheer from the website. The notification arrives even with the app closed.

Details: https://docs.expo.dev/push-notifications/push-notifications-setup/
