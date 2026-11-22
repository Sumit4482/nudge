# Nudge

A calm Android app that plans your day around when you really wake, leave and get home, keeps one task pinned until you prove it, and rewards you softly. Built with Expo SDK 58, TypeScript and Expo Router.

**Live proof wall:** https://nudge-wall.vercel.app. Every tick on it has a photo behind it. No photo, no tick.

## Run it

```bash
npm install
npx expo start --go          # open in Expo Go on your phone (same Wi-Fi), or add --tunnel
npx expo start --dev-client  # when you have a development build
```

Checks: `npm run typecheck`, `npm run lint`, `npm test`.

## What is where

| Folder | What |
|---|---|
| `src/planner` | The pure day planner and its tests. No React Native imports. |
| `src/store` | One zustand store, saved on the phone. |
| `src/app` | Screens: Today, Routines, Study, You, plus sheets (focus, proof, reward, check-in, why, snooze, stake) and Settings. |
| `src/features` | Screen pieces and background services. |
| `src/services` | AI breakdown. |
| `src/wall` | Proof wall upload client (Supabase). |
| `supabase/` | Database setup SQL and the setup guide. |
| `web/` | The public proof wall website (Next.js). |
| `docs/` | The design demo, wall design and build guide. |

## Links

| | |
|---|---|
| Live proof wall | https://nudge-wall.vercel.app |
| Wall setup guide | [`supabase/README.md`](supabase/README.md) |
| Wall website code | [`web/`](web) |
| Wall design | [`docs/wall.html`](docs/wall.html) |

## Things you set up yourself

- **AI breakdowns:** work out of the box with a free keyless AI (about 1 reply per 45 seconds). Only the task title and length are sent. Optional: paste an Anthropic key in Settings to use Claude instead.
- **Proof wall:** follow `supabase/README.md`, then deploy `web/` to Vercel with the same two values.
- **Android push and builds:** put your own `google-services.json` in the project root (it is not in git), and on EAS add it as a file variable named `GOOGLE_SERVICES_JSON`.
- **Voice notes and image resizing** need a development build made after `expo-audio`, `expo-asset` and `expo-image-manipulator` were added.

## Not built

Focus lock (blocking other apps while a task runs) needs a custom Android native module. It is not included.

## Over-the-air updates (EAS Update)

Small changes (screens, logic, text, styles) can reach a preview or production build without a new build. Changes to native code (adding a library, changing `app.json` plugins or permissions) need a new build.

- Builds listen on a channel: `preview` and `production` (set in `eas.json`). The runtime version uses the `fingerprint` policy, so an update is only offered to builds with matching native code.
- Publish an update to your preview build:

  ```bash
  npx eas-cli update --channel preview --message "what changed" --environment preview
  ```

- The app downloads it in the background on start. Force close and reopen it (up to twice) to see the change.
- The first build that includes this (any build made after `expo-updates` was added) is the one that can receive updates. The older development build cannot.
- If the native code changed since the last build, `eas update` still publishes, but the old build ignores it. Make a new build instead.

## Your plan data

Your routines, exercises, study topics and goals live in `src/store/seed.ts`. Your usual day (wake 06:30, leave 10:00, home 19:45, sleep 22:30) is in `src/lib/times.ts`. The planner keeps its own generic defaults in `src/planner/constants.ts`.

The app saves its state on the phone. Editing the seed changes nothing on a phone that already has saved data. To load a changed seed on a fresh start, bump the storage name in `src/store/useApp.ts` (currently `nudge-state-v3`). That also resets XP, streak and history. The old demo data used for tests is in `src/store/demoSeed.ts`.
