---
title: Backwards dream
summary: A slow melody whose echoes play in reverse, swelling into each note before it arrives, inside a reverb that builds slowly. Like a tape played backwards in a dream.
mood: Reverse echoes, slow melody
level: Easy
time: 10 min
key: D minor
order: 4
---

## What you'll hear

Each note you play comes back reversed: it swells up instead of fading out. The reverb builds slowly too, so the whole thing breathes in rather than out.

**The trick:** the Grand Canyon's REVERSE listens for each new note and reverses what follows it. A light on the pedal blinks each time it hears one, so you can tune it by eye.

## 1. PERfourMER: a soft, clear note

Synth channel 1 on MIDI channel 1; channels 3 and 4 **VOLUME** down.

```settings
WAVE :: [sine|*triangle*|square|saw|noise|EXT] :: Soft, clear notes reverse cleanly.
OCTAVE :: 8' :: Middle register.
CUTOFF :: noon :: Half open.
RESONANCE :: min :: Clean.
ATTACK :: min :: A clear start, so the pedal can hear each note.
DECAY :: 11 o'clock :: Medium.
SUSTAIN :: 10 o'clock :: A little held.
RELEASE :: 11 o'clock :: Medium fade.
PAN :: noon :: In the main left output, which feeds the pedals.
```

## 2. Grand Canyon: everything backwards

```settings
DELAY TYPE :: REVERSE :: Reverse echoes, with a detector that listens for each new note.
SENSITIVITY (left mini knob) :: noon :: Then adjust: the REVERSE LED should blink on every note the OXI plays, and not in between.
MOD DEPTH (right mini knob) :: 10 o'clock :: A little movement in the reversed sound.
DELAY :: 1 o'clock :: Long: the reversed swell needs time.
FEEDBACK :: 10 o'clock :: One or two repeats.
DELAY LVL :: 2 o'clock :: Up to where dry and reverse are both full: past 2 o'clock the dry note starts to drop.
Tempo :: Don't tap: set it with the DELAY knob above :: A long, free delay suits the slow melody better than a locked one.
```

## 3. NightSky: a slow-building wash

```settings
TEXTURE :: [sparse|dense|*diffuse*] :: Slow-building: excels at swell and reverse-like textures.
LENGTH :: 1 o'clock :: Medium-long.
SIZE/PITCH :: noon :: Middle.
FILTER :: [*regen*|low pass] :: Darkens as it decays.
HIGH CUT :: noon :: Soft.
LOW CUT :: 10 o'clock :: Room for the bass.
TARGET :: [verb|pitch|*filter*] :: Modulation moves the HIGH CUT: the brightness drifts.
SHAPE :: [*triangle*|square|ramp|saw|random|env] :: Even.
SPEED :: 8 o'clock :: Very slow.
DEPTH :: 11 o'clock :: Noticeable drift.
SHIMMER (knob) :: min :: Off.
GLIMMER :: [high|*low*|off] :: Mysterious lows.
DRY :: noon :: Unity.
REVERB :: noon :: Even with the dry signal.
```

## 4. The OXI One: play it

1. Tempo 60–75 BPM: slow is the point.
2. Sequencer 1 (Mono, Ch 1): a slow melody in D minor (try D, F, A, C, E), one note every 4 steps, with rests. Each note about 2 steps long (hold the pad, turn **knob 3**).
3. Sequencer 2 (Mono, Ch 2, the bass patch from the rig page): a low D, one long note per two bars, tied.

## You got it right when

- The REVERSE LED **blinks once per note**.
- Each note is followed by a **swell** that rises into silence instead of fading.

## 5. The performance

- Turn **SENSITIVITY** down while it plays: the pedal hears fewer notes, and the reversed phrases get longer and stranger.
- Press **INFINITE** on the NightSky over a reversed swell to hold it as a pad.

## If it sounds wrong

- **No reverse, or random chops:** watch the REVERSE LED. If it doesn't blink on each note, turn SENSITIVITY up; if it blinks between notes, turn it down.
- **Reverse sounds too quiet:** DELAY LVL up, but stay at or below 2 o'clock to keep the dry note.

## Sources

- [Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): REVERSE, SENSITIVITY and the blinking LED (p. 17), DELAY LVL (p. 8).
- [NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): diffuse "swell, and even reverse-like textures" (p. 5), TARGET filter (p. 10).
- [PERfourMER MKII manual](https://archive.org/details/manualzilla-id-7445238): envelope (p. 20).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): steps and gates (pp. 51, 55).
