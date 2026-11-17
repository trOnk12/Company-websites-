---
title: Tape memory
summary: A fast arpeggio where every note is a different instrument, echoed by a worn tape machine and a grainy small room. Like a cassette of a song you half remember.
mood: Lo-fi arpeggio, round-robin voices
level: Easy
time: 10 min
key: C major
sound: tape
order: 3
---

## What you'll hear

A quick sixteenth-note pattern. Each note comes from the next synth channel in turn, each set up differently, so one line sounds like three instruments trading notes. The echoes warble and wear out like old tape.

**The trick:** the PERfourMER's **M2** play mode sends each new note to the next channel. The manual says it makes one sequence sound like several new ones.

## 1. PERfourMER: three different voices, one line

Synth channels **1, 3 and 4** on MIDI channel 1, **PLAYMODE M2**. Rows marked (all) are the same on the three channels: set channel 1, then match the others by eye.

```settings
PLAYMODE :: [M1|*M2*|P1|P2|D1|D2] :: Mono 2: note 1 goes to channel 1, note 2 to channel 3, note 3 to channel 4, and around again.
Channel 1 WAVE :: [sine|triangle|*square*|saw|noise|EXT] :: Hollow and woody.
Channel 3 WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Bright.
Channel 4 WAVE :: [sine|*triangle*|square|saw|noise|EXT] :: Soft, like a flute.
Channel 4 OCTAVE :: 4' :: An octave up: a sparkle every third note. Channels 1 and 3 stay at 8'.
CUTOFF (all) :: noon :: Half open.
Filter EG INT (all) :: 1 o'clock :: A little pluck on each note.
ATTACK (all) :: min :: Instant.
DECAY (all) :: 10 o'clock :: Short.
SUSTAIN (all) :: min :: Plucked, not held.
RELEASE (all) :: 9 o'clock :: No clicks.
PAN (all) :: noon :: In the main left output, which feeds the pedals.
```

## 2. Grand Canyon: a worn tape echo

```settings
DELAY TYPE :: TAPE :: An old tape echo: repeats degrade and distort.
TAP DIV :: Press until only the eighth LED lights :: Echoes on the off-beat eighths, under the sixteenths.
Tempo :: Tap the TAP/LOOP footswitch on each beat :: Locks the echoes to the OXI's tempo.
FEEDBACK :: noon :: Several repeats, each one more worn.
DISTORTION (left mini knob) :: 10 o'clock :: A little tape grit.
FLUTTER DEPTH (right mini knob) :: 1 o'clock :: The warble: notes bend slightly, like a stretched cassette.
DELAY LVL :: 11 o'clock :: Echoes under the dry line.
PING PONG :: [off|*on*] :: Echoes bounce left and right.
```

## 3. NightSky: a grainy small room

```settings
TEXTURE :: [*sparse*|dense|diffuse] :: Granular: with short, staccato notes it adds a grainy texture.
LENGTH :: 10 o'clock :: Short: a room, not a hall.
SIZE/PITCH :: 11 o'clock :: A little smaller than the middle (clockwise makes the space bigger).
FILTER :: [regen|*low pass*] :: A synth-style roll-off on the output.
HIGH CUT :: 1 o'clock :: Takes the hiss off, like tape.
LOW CUT :: 9 o'clock :: Barely.
SHIMMER (knob) :: min :: Off.
GLIMMER :: [high|low|*off*] :: Off: keep it simple.
DEPTH :: min :: No modulation: the tape already wobbles.
DRY :: noon :: Unity.
REVERB :: 11 o'clock :: A light coat.
```

## 4. The OXI One: play it

```steps
Seq 1 · C E G B D… :: xxxxxxxxxxxxxxxx
Seq 2 · bass C :: x.......x.......
```

Sequencer 1 Mono on Ch 1; sequencer 2 Mono on Ch 2 for the bass.

1. Tempo 95–110 BPM.
2. Sequencer 1: fill all 16 steps with a pattern of 4 or 5 notes repeating (for example C, E, G, B, D). A length that isn't a multiple of 3 keeps changing which of the three voices plays which note.
3. Short gates: hold a pad and turn **knob 3** down.
4. Sequencer 2 (the bass patch from the rig page): a low C on steps 1 and 9.

## You got it right when

- Consecutive notes come from **different-sounding voices**.
- The echoes **wobble** slightly and get darker with each repeat.

## 5. The performance

- Switch **PLAYMODE** between **M1** and **M2** while it plays: the same notes become one instrument, then three.
- Hold the Grand Canyon's **TAP/LOOP** footswitch: it ramps the feedback to maximum, and ramps back to your setting when you release. A tape run-away on demand.

## If it sounds wrong

- **All notes sound the same:** PLAYMODE isn't M2, or channels 3 and 4 aren't on MIDI channel 1.
- **Seasick:** FLUTTER DEPTH lower.
- **Echoes pile into mush:** FEEDBACK lower, or DELAY LVL lower.

## Sources

- [PERfourMER MKII manual](https://archive.org/details/manualzilla-id-7445238): PLAYMODE M2, "the impression of (up to) four new sequences" (pp. 26–27).
- [Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): TAPE (p. 18), TAP DIV (p. 12), hold TAP/LOOP to ramp feedback (p. 13).
- [NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): sparse texture (p. 5), FILTER low pass (p. 4).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): steps and gates (pp. 51, 55).
