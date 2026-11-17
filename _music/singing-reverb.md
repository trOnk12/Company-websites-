---
title: The singing reverb
summary: The synth holds one note. The reverb plays the melody: its built-in eight-step sequencer retunes the cloud in a pentatonic scale, gliding from note to note.
mood: Drone plus a melody played by the reverb
level: Medium
time: 15 min
key: A, major pentatonic
sound: sing
order: 5
---

## What you'll hear

A warm, unchanging drone. Above it, the reverb itself sings a slow, gliding melody, always in key, because the NightSky snaps each step to a scale.

**The trick:** the NightSky has an eight-step sequencer for its SIZE/PITCH knob. Freeze a note, and each step retunes the frozen cloud.

## 1. PERfourMER: a long drone

Synth channel 1 on MIDI channel 1; channels 3 and 4 **VOLUME** down.

```settings
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Plenty of harmonics for the reverb to work with.
OCTAVE :: 16' :: Low and full.
CUTOFF :: 10 o'clock :: Dark.
RESONANCE :: 10 o'clock :: A little glow.
Filter LFO INT :: 9 o'clock :: Slow movement in the drone.
LFO WAVE :: [S&H|*sine*|saw or square] :: Smooth.
LFO SPEED/PHASE :: 8 o'clock :: Very slow.
VCA MODE :: [EG|GATE|*ON*] :: Always on: a true drone that never re-swells when the OXI loops. Turn VOLUME down to stop it.
PAN :: noon :: In the main left output, which feeds the pedals.
```

## 2. Grand Canyon: a warm analog-style echo

```settings
DELAY TYPE :: DMM :: The Deluxe Memory Man emulation: dark, warm repeats.
MOD RATE (left mini knob) :: noon :: The manual says noon matches the original's chorus setting.
MOD DEPTH (right mini knob) :: 10 o'clock :: Gentle chorus.
DELAY :: noon :: Medium.
FEEDBACK :: 10 o'clock :: A few repeats.
DELAY LVL :: 11 o'clock :: Under the drone.
```

## 3. NightSky: set up the sound

```settings
TEXTURE :: [sparse|*dense*|diffuse] :: Dense: the pitch steps stay clear.
LENGTH :: 3 o'clock :: Very long.
QUANTIZE :: [smooth|half step|*scale*] :: Every step snaps to a scale.
Scale :: Hold QUANTIZE and press PRESET button 2 :: Major pentatonic (it's also the factory setting). Button 1 is minor pentatonic.
FILTER :: [*regen*|low pass] :: Darkens as it decays.
HIGH CUT :: noon :: Soft.
LOW CUT :: 9 o'clock :: Barely.
SHIMMER (knob) :: min :: Off: the sequence is the movement.
DEPTH :: min :: No modulation.
DRY :: noon :: Unity.
REVERB :: 2 o'clock :: The singing cloud should be loud.
```

## 4. The OXI One: start the drone

```steps
Seq 1 · drone A :: x===============
```

1. Tempo around 60 BPM.
2. Sequencer 1 (Mono, Ch 1): an **A** on step 1, tied across all 16 steps. With VCA MODE on ON, the drone sounds continuously at that pitch.
3. Leave the bass out: the drone is enough.

## 5. NightSky: program the melody

1. Keep the drone running (step 4) so there's sound in the reverb while you program: the manual's tip.
2. Hold the **INFINITE** footswitch until the **ON** LED turns red: you're in Sequence mode. The 8 PRESET buttons are now the 8 steps.
3. Press PRESET buttons **1 to 5** so they light amber: five active steps. An unlit step is skipped, not a rest.
4. For each step: hold its PRESET button and turn **SIZE/PITCH** to pick its note. Counter-clockwise is higher.
5. Add glide: hold **SHAPE** and turn **REVERB** to about 11 o'clock. Steps now slide into each other.
6. Run it: tap the **FAVORITE** footswitch on the beat a few times. It plays at that tempo; each step can be up to 2 seconds.
7. Stop: press the **ON** footswitch once (it returns to step 1). To leave Sequence mode, hold **INFINITE** again.

## You got it right when

- The drone **never stops** or re-swells.
- The reverb **moves between pitches** in a loop, gliding, while the drone stays put.

## 6. The performance

- Change the scale: leave Sequence mode (hold INFINITE), hold QUANTIZE and press PRESET 1 for minor pentatonic, then re-enter. The same melody turns sad. (In Sequence mode the PRESET buttons are the steps.)

## If it sounds wrong

- **The sequence won't run:** at least two steps must be active (lit amber).
- **Steps sound out of key:** QUANTIZE isn't on *scale*.
- **The melody is too fast:** tap FAVORITE more slowly.

## Sources

- [NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): Sequence mode, programming steps, glide and tempo (pp. 21–24), QUANTIZE and scales (pp. 6–7), factory scale (p. 41).
- [Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): DMM, "The noon setting is equivalent to a DMM's chorus setting" (p. 18).
- [PERfourMER MKII manual](https://archive.org/details/manualzilla-id-7445238): LFO (p. 16), envelope (p. 20).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): ties (p. 55).
