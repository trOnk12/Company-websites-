---
title: The database is the truth
short: Offline-first
summary: The user opens your notes app in a tunnel: a spinner, then an error. On the next screen, a note they just wrote is missing. Both have one cause. Here's the structure Android recommends instead: one place every screen reads from.
takeaway: An offline-first app reads only from its local database, which is the source of truth; the UI observes it and updates on its own. A repository writes changes locally first and syncs them with the network when it can; network results are written into the database, never straight to the screen. Then the app works offline, and every screen agrees.
---

## The problem

Your notes screen calls the API and shows the result. In a tunnel, it shows a spinner, then an error. Worse: another screen keeps its own list, so a note just written on one screen is missing on the other until a refresh. What structure fixes both?

## See it

```diagram offline
```

## The building block

The problem is that the screen has several places to get data from: the network response, its own list, maybe a cache. When they disagree, the screens disagree.

An **offline-first** app picks one: the local database (Room, on Android) is the **source of truth**. (Puzzle 7's HTTP cache still has a job: it makes the repository's network calls cheap. But screens never read it directly.) It's the only place the UI ever reads from.

The parts:

- The **repository** combines two data sources: the local database and the network API.
- **Reads:** the UI observes the database, for example as a `Flow`. When the database changes, every screen showing that data updates by itself.
- **Network results** never go straight to the screen: the repository writes them into the database, and the screens update from there.
- **Writes:** the user's change goes into the database first, so it shows at once, even offline, and is marked to sync. When there's a connection, the repository sends it to the server; WorkManager can schedule attempts subject to constraints; a permanent error still needs a recovery path.

In a tunnel, the screen shows what's in the database, with no spinner. The new note shows on every screen at once, because they all read the same table.

Two devices can still edit the same note offline. Then the server must decide who wins; a common rule is "last write wins", by timestamp. It's simple but lossy: the other edit silently disappears, and phone clocks can be wrong, so prefer server time or version numbers. Module 2 covers conflicts.

## The analogy

A team with one shared whiteboard. Everyone reads the whiteboard, never each other's notes. The runner who goes to head office (the network) copies what they bring back onto the whiteboard, and takes the whiteboard's new items with them on the next trip.

## Check yourself

- In an offline-first app, the network returns a fresh list of notes. Where does it go?::*Into the local database, and the screens update from there||Straight to the screen that asked for it, then into the database >> Then other screens could disagree; results always go through the database. >> s3||Into a separate in-memory cache next to the database >> A second store is a second source of truth: the thing this design removes. >> s3::Network → database → screens.
- The user writes a note in a tunnel. What does the app do?::*Saves it to the database at once and syncs it later when online||Shows an error, since the server can't be reached >> Writes go to the local database first; the network can wait. >> s4||Keeps it in the screen's state until a connection comes back >> Screen state is lost if the app dies; the database survives. >> s4::Write locally first, sync later.
- What's the difference between the source of truth and the network data source?::*The app reads only the source of truth, while the network data source feeds it||The app reads only the network data source, while the source of truth feeds it >> That's the two swapped. >> the-building-block::What the UI reads vs what fills it.

## Sources

- [Android Developers: Build an offline-first app](https://developer.android.com/topic/architecture/data-layer/offline-first) ("An offline-first app has a minimum of 2 data sources for every repository that utilizes network resources: The local data source, The network data source"; "The local data source is the canonical source of truth for the app. It should be the exclusive source of any data that higher layers of the app read"; "For mobile apps, a common approach is 'last write wins.'")
