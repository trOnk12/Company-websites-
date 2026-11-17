---
title: Three against four
summary: A bass in plain 4/4 and an echo that only knows threes. The two cycles cross and meet again every bar, and a simple blip becomes a groove.
mood: Polyrhythmic echo groove
level: Medium
time: 15 min
key: E minor
order: 6
---

## What you'll hear

The bass thumps four times a bar. A short blip plays once, and the echo answers it three times, evenly spread across the same bar. Three against four: it feels like the groove is turning over itself.

**The trick:** the Grand Canyon's DRUM echo spreads its echoes over the delay time, one per playback head. Its secondary mode uses three heads instead of four.

## 1. PERfourMER: a short blip and a bass

Synth channel 1 (MIDI 1) is the blip; channel 2 (MIDI 2) is the bass, out of its own jack. Channels 3 and 4 **VOLUME** down.

```settings
Ch 1 WAVE :: [sine|triangle|*square*|saw|noise|EXT] :: A woody blip.
Ch 1 OCTAVE :: 4' :: High, so it cuts through.
Ch 1 CUTOFF :: 1 o'clock :: Bright.
Ch 1 RESONANCE :: 11 o'clock :: A resonant ping.
Ch 1 ATTACK :: min :: Instant.
Ch 1 DECAY :: 9 o'clock :: Very short: a blip.
Ch 1 SUSTAIN :: min :: Nothing held.
Ch 1 RELEASE :: min :: Clean stop: the echo pattern stays crisp.
Ch 2 WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: A full bass.
Ch 2 OCTAVE :: 16' :: Low.
Ch 2 CUTOFF :: 10 o'clock :: Round.
Ch 2 Filter EG INT :: 1 o'clock :: A little punch on each note.
Ch 2 DECAY :: 10 o'clock :: Short, so the four beats are clear.
Ch 2 SUSTAIN :: 10 o'clock :: A little body. Everything else on channel 2: the bass patch from the rig page.
```

## 2. Grand Canyon: a three-head drum echo

```settings
DELAY TYPE :: DRUM :: A magnetic drum echo: the delay time is split evenly between its playback heads.
Secondary mode :: Hold PING PONG about 2 s, until the DRUM LED blinks, then let go :: Three heads instead of four: rhythms in threes.
RHYTHM (left mini knob) :: step 7/8 :: heads 1, 2 and 3 :: All three heads play: three even echoes. Count the positions from fully left.
DRUM AGE (right mini knob) :: 11 o'clock :: A bit of age: darker, slightly distorted, warbling.
TAP DIV :: Press until only the quarter LED lights :: So the tapped time is used as is.
Tempo :: Tap the TAP/LOOP footswitch once per bar, on the bar's first beat :: The delay time becomes one whole bar, so its three heads land evenly across it: three against the bass's four.
FEEDBACK :: 9 o'clock :: Mostly one pass: the pattern stays clear.
DELAY LVL :: noon :: Echoes as loud as they need to be heard.
```

## 3. NightSky: a small, tight room

```settings
TEXTURE :: [sparse|*dense*|diffuse] :: A fast, dense plate.
LENGTH :: 10 o'clock :: Short, so the rhythm stays tight.
SIZE/PITCH :: 11 o'clock :: A smaller space (clockwise makes it bigger).
FILTER :: [regen|*low pass*] :: Simple tone control.
HIGH CUT :: 1 o'clock :: A little soft.
LOW CUT :: noon :: No low end in the reverb at all.
SHIMMER (knob) :: min :: Off.
GLIMMER :: [high|low|*off*] :: Off.
DEPTH :: min :: No modulation.
DRY :: noon :: Unity.
REVERB :: 10 o'clock :: Just a little air.
```

## 4. The OXI One: play it

1. Tempo 90–100 BPM. Not slower than about 85: one bar must fit in the delay's 3-second maximum.
2. Sequencer 1 (Mono, Ch 1): one blip on step 1. Short gate.
3. Sequencer 2 (Mono, Ch 2): a low E on steps 1, 5, 9 and 13: four on the floor.
4. Tap the Grand Canyon's TAP/LOOP once on each bar's first beat, two bars in a row.

## You got it right when

- Count the bass 1-2-3-4: the **three echoes land between** its beats, and meet it again on beat 1.

## 5. The performance

- Turn **RHYTHM** to other positions: some play two of the three heads, for lopsided patterns.
- Leave secondary mode (hold PING PONG again) and turn RHYTHM to position 4: four heads, a plain echo on every beat, and suddenly everything lines up with the bass. Switch back and forth for tension and release. (In standard mode the RHYTHM positions pick different rhythms.)

## If it sounds wrong

- **Echoes land on the bass beats:** you're in standard (four-head) mode, or the delay isn't one bar. Re-tap once per bar.
- **The tap won't stretch to a bar:** the delay tops out at 3 seconds, so below about 85 BPM a bar is too long. Speed up, or tap half a bar and hear it as three against two.

## Sources

- [Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): DRUM, the rhythm table and "the delay time is divided by total number of drum playheads" (p. 21), secondary mode (p. 34), TAP DIV (p. 12).
- [NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): dense texture (p. 5), LOW CUT (p. 4).
- [PERfourMER MKII manual](https://archive.org/details/manualzilla-id-7445238): filter and envelope (pp. 12–20), individual outputs (p. 21).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): steps and gates (pp. 51, 55).
