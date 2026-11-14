---
title: Starting an app, cold, warm and hot
short: Starting an app
summary: Opening an app can mean very different amounts of work, depending on whether its process and its screen still exist.
takeaway: Cold start = fork Zygote, create your Application, then the first Activity. Warm = process alive, Activity created again. Hot = both alive, just brought to the front.
---

## The problem

In puzzles 10 and 11, a new app process was forked from Zygote. But is a process forked every time you open an app? Sometimes the app opens instantly, sometimes it takes a second. What's the difference?

## See it

```diagram start
```

## The building block

Your app has one `Application` object per process: a place for setup the whole app needs, like opening a database. It's created right after the fork, and its callback `Application.onCreate()` runs before any Activity exists.

- **Cold start**: no process yet. Fork from Zygote, create the Application, then create the first Activity.
- **Warm start**: the process is still alive, but the Activity was destroyed (puzzle 3), for example because the user closed it, so it's created again.
- **Hot start**: process and Activity are both alive, stopped in the background; system_server just brings the screen back to the front.

## The analogy

Cold: build the house from the show house, move in, set up the room. Warm: the house stands, set up the room again. Hot: everything's ready, just open the curtains.

## Check yourself

- You put a slow database setup in `Application.onCreate()`. Which starts get slower?::*Cold starts only: that's when the Application is created||Every start, including hot >> The Application is created once per process. Warm and hot starts reuse the living process. >> s4||Only hot starts >> Hot starts create nothing new. The Application only appears in a cold start. >> s2::Application.onCreate() runs once per process, in a cold start, before any screen.
- The user comes back to your app a minute later and it opens instantly. Which kind of start was that likely?::*Hot: process and Activity were still alive||Cold: a fresh fork is always fastest >> A cold start does the most work: fork, Application, Activity. >> s2::Hot starts reuse everything.
- What's the difference between a warm and a cold start?::*Warm reuses the living process; cold has to fork a new one first||Warm starts skip creating the Activity >> That's a hot start. A warm start creates the Activity again. >> s3::Warm: process alive, screen rebuilt. Cold: everything from scratch.

## Sources

- [Android Developers: App startup time](https://developer.android.com/topic/performance/vitals/launch-time)
- [Android Developers: The activity lifecycle](https://developer.android.com/guide/components/activities/activity-lifecycle)
