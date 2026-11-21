@AGENTS.md

# Nudge: project brief

Personal Android app. Expo SDK 58, TypeScript, Expo Router (routes in src/app). One user, no backend in v1.
Purpose: beat procrastination. Plan my day around when I really wake, leave and get home. Make me start. Keep a notification pinned until I upload photo proof. Reward me calmly. Be soothing, never loud.

## Rules for working in this repo
- Before using any Expo or React Native API, read the versioned SDK 58 docs (see AGENTS.md). Do not rely on memory.
- Install packages with: npx expo install <pkg>. Never npm add for Expo packages.
- Never edit android/ or ios/ by hand. Use app.json and config plugins.
- Run npx tsc --noEmit and npx expo lint before saying a task is done.
- Keep non-route code out of src/app. Put the planner in src/planner and make it pure (no React Native imports).
- Visual and behavior reference: docs/prototype.html. Match it. Its plan() function is a working planner.

## Core loop
Add task -> planner places it in free windows -> I start (Just 5 minutes, or full focus) -> notification stays pinned until I upload a proof photo -> soft reward -> day re-plans.

## Day anchors (no fixed hours)
I tap: wake, leave (for office), home, sleep.
Weekday phase: dawn after wake, day after leave, dusk after home, night after sleep or before wake.
Weekend (Sat, Sun) has no office. Phase follows the clock: before 11:00 dawn, before 17:00 day, before 20:30 dusk, else night.
Defaults before I tap, in minutes since midnight: wake 450, leave 615, office start 660, home 1170, sleep 1410.
An anchor time is never earlier than the previous anchor or the current time.

## Planner: src/planner/plan.ts
plan({ tasks, anchors, now, dow, busy }) returns { blocks, later, win }.
Windows, weekday: morning = [wake+20, leave-20]. evening = [home+20, sleep-30]. Missing anchors use defaults.
Windows, weekend: [wake+20, 780], [840, 1110], [1170, sleep-30].
Every window starts no earlier than now rounded up to 5 minutes. Drop windows shorter than 10 minutes.
Evening is "predicted" (shown with ~) until home is tapped.
Remove busy calendar intervals from windows (Phase 5).
Pool: not done, not paused, and days is empty or includes today.
Order: must desc, prio desc, mins desc.
Placement: prefer the task's own window (morning or evening). Tasks of 40 minutes or more go to the largest remaining window. Otherwise the earliest window that fits. 10-minute gap after each task. No fit goes to later (tomorrow).
Free block: leftover time of 25 minutes or more in a window.
Office block (weekday): from leave (or 660) to home (or 1170).
At most 3 must-do tasks. A task rolled over 3 times must be broken down or dropped.
Routines (laundry Sat, clean room Sat/Sun, workout, weekly review Sun) are tasks with days set. Missed ones skip, never pile up.

## Focus and proof
One active task at a time. Starting another shows: finish the current one first.
Just 5 minutes starts a 5 minute run. At the end offer +10 minutes or Add proof.
While a task is active, a pinned notification (Android sticky) shows title, current step and an Add proof button. It clears only after a proof photo is saved.
Big task: show only the current step. Steps are 10-25 minutes, first step 2 minutes or less.

## Free-time check-in
When a free block of 20+ minutes starts and nothing is active, send a notification: "You're free. Doing what?" Actions: start next task, resting 15, scrolling (honest), something else. Log the answer.

## Rewards
XP per task = round(mins x 1.2), plus 20 if must-do. 40% chance of a bonus drop of 15 to 34 XP.
Level = floor(xp / 500) + 1. Streak +1 on the first completed task of a day.
Weekly reward set by me, default "Movie night" at 1500 XP.

## Data model (src/types.ts)
Task, Routine fields live on Task. DayState holds anchors and done ids. Proof holds the photo uri.

## Design tokens
Phases: dawn, day, dusk, night. The sky is 4 gradient layers cross-fading over 2.2s. Accent changes per phase.
dawn: sky #FDF0E4 > #F9D7C4 > #F1BDB3, ink #3A2A3A, accent #CB6747
day: sky #EDF6FC > #D5E8F5 > #BEDAEE, ink #1F3A57, accent #3B76AC
dusk: sky #F8DFCF > #EBBBB8 > #9BA7C6, ink #43303F, accent #BE5A74
night: sky #26356A > #1B2850 > #121B38, ink #F2EEE8, accent #F0C878 (button text #1B2340)
Tag colors: fit #D9734F, study #4C86B8, life #4E9F82.
Easing cubic-bezier(.22, .8, .3, 1). No overshoot or shake. Respect reduce-motion.
Fonts: Bricolage Grotesque (headings), Figtree (text), DM Mono (times).
