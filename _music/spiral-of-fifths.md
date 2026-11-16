---
title: The spiral of fifths
summary: Play one note; it grows into a rising cascade of fifths that melts into a dark cloud. It sounds like a whole chord played by someone else.
mood: Cosmic arpeggio from one note
order: 1
---

## What you'll hear

One short note. Then its echo a fifth higher, then a fifth above that, climbing like stairs: C, G, D, A, E. The reverb blurs the stairs into a chord and darkens the top, so it stays warm. The dry bass sits underneath.

**The rule of this recipe:** the Grand Canyon makes the notes; the NightSky blurs and darkens them. If both added high sounds, it would be noise.

## 1. PERfourMER: a short note with a clear attack

Synth channel 1, on MIDI channel 1. Turn synth channels 3 and 4 **VOLUME** fully down.

```settings
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Rich in harmonics, so each echo is easy to hear.
OCTAVE :: 8' :: Middle register: the spiral climbs almost 3 octaves from here.
Oscillator EG INT :: noon :: Centre: no pitch envelope.
Oscillator LFO INT :: noon :: Centre: no vibrato, so the fifths stay in tune.
CUTOFF :: 11 o'clock :: Slightly open.
RESONANCE :: 9 o'clock :: A touch of bite.
Filter EG INT :: 1 o'clock :: The envelope opens the filter a little at each note: a clear attack.
TRACK :: [0%|*50%*|100%] :: Higher notes stay bright enough.
VCA MODE :: [*EG*|GATE|ON] :: The envelope shapes the volume.
ATTACK :: min :: Instant start.
DECAY :: 10 o'clock :: Short note: it leaves room between repeats, so you hear each echo separately.
SUSTAIN :: min :: No held tail.
RELEASE :: 9 o'clock :: A short fade, no click.
PAN :: noon :: In the main left output, which feeds the pedals.
```

## 2. Grand Canyon: PITCH, where the magic happens

Make sure only the **DELAY** LED is lit (press the small Mode button until it is), and no top-left buttons are lit.

```settings
DELAY TYPE :: PITCH :: Turn the big knob until the PITCH LED lights.
Secondary mode :: Hold PING PONG about 2 s, until the PITCH LED blinks, then let go :: The key step. By default the pitch shift is outside the feedback loop, so every echo has the same pitch. In secondary mode each echo is shifted again: one echo a fifth up becomes a staircase.
MODE (mini knob) :: step 5/5 :: upward shift + dry :: Modes 1 and 5 feed your dry note into the delay, so the spiral starts from your note, not straight from the fifth.
PITCH (mini knob) :: step 7/12 :: perfect 5th :: Fifths from C: C, G, D, A, E. Those five notes are the pentatonic scale, the "nothing clashes" scale, so the spiral builds a pretty chord on its own.
FEEDBACK :: 10:30 o'clock :: A few repeats. Each fifth is 7 semitones, so 5 repeats climb 35, almost 3 octaves. More ends in a squeal.
TAP DIV :: Press until the eighth + DOT LEDs light :: A dotted eighth falls between the beats, so the cascade skips across the rhythm like a live arpeggiator, not a metronome.
Tempo :: Tap the TAP/LOOP footswitch on each beat of the OXI's tempo :: The tapped time is a quarter note; TAP DIV turns it into a dotted eighth.
DELAY LVL :: 1 o'clock :: Past 2 o'clock the dry signal starts to drop; at max you'd hear only echoes and lose your note.
PING PONG :: Your choice :: Check it after the secondary step. On, the stairs bounce left and right.
```

## 3. NightSky: blur the stairs into a cloud

```settings
TEXTURE :: [sparse|dense|*diffuse*] :: Diffuse is a slow-building, atmospheric wash: it turns single steps into one sound.
LENGTH :: 2 o'clock :: A long tail, so each new note lands on the last one's cloud.
SIZE/PITCH :: noon :: Middle: the reverb isn't pitched up or down.
FILTER :: [*regen*|low pass] :: The most important setting here. Regen cuts highs inside the regenerating core, so the reverb gets darker as it decays.
HIGH CUT :: 11 o'clock :: The spiral goes very high; this takes the sharp top off the tail. Warm, not piercing.
LOW CUT :: 10 o'clock :: Cuts lows at the output and in the core, so the reverb leaves room for the bass.
TARGET :: [*verb*|pitch|filter] :: Modulation moves the reverb's delay lines.
SHAPE :: [*triangle*|square|ramp|saw|random|env] :: An even rise and fall.
SPEED :: 8 o'clock :: Slow: the cloud breathes.
DEPTH :: 10 o'clock :: Gentle.
SHIMMER (knob) :: min :: Off. The spiral already makes the high notes; shimmer would add more and turn it to chaos.
GLIMMER :: [high|*low*|off] :: Low brings out lower harmonics: mysterious, synth-like. A counterweight to the high spiral.
DRIVE :: [pre|post|*off*] :: Clean.
DRY :: noon :: Noon is unity: your signal at the same volume.
REVERB :: 1 o'clock :: Cloud a little under the dry signal. Raise it for more space.
```

## 4. The OXI One: play it

Sequencer 1 (Mono, Ch 1) plays the spiral; sequencer 2 (Mono, Ch 2) plays the bass.

1. Set the tempo: hold **Shift**, turn **knob 1**. Around 80–90 BPM gives the spiral time.
2. Sequencer 1: tap **one note per bar**, or one every two bars, on step 1. Less is more: the spiral does the rest.
3. Keep the gate short: hold the step's pad and turn **knob 3** until it's one step long.
4. Sequencer 2: a low root note on step 1, tied across the bar (hold the pad and turn **knob 3** quickly clockwise).
5. Change the note rarely. Each note builds its own pentatonic stairs, so notes a fifth apart sound best together: A, then E.

## 5. The performance

- **Climax:** press **INFINITE** on the NightSky. It holds the cloud and still lets new sound in on top (that's the factory setting, *Infinite Input: on*), so the cloud stands still and you play new notes over it.
- **Way out:** release INFINITE and turn the Grand Canyon's **FEEDBACK** down. The spiral shortens and the cloud slowly fades.

## If it sounds wrong

- **Every echo has the same pitch:** secondary mode is off. Hold PING PONG again until the PITCH LED blinks.
- **It squeals:** FEEDBACK down a little, or HIGH CUT further left.
- **Your note disappears:** DELAY LVL is past 2 o'clock.
- **Mud:** shorter DECAY on the PERfourMER, or LENGTH down on the NightSky.

## Sources

- [Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): PITCH modes and intervals (p. 19), secondary mode (p. 34), DELAY LVL (p. 8), TAP DIV (p. 12).
- [NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): TEXTURE (p. 5), FILTER, HIGH CUT, LOW CUT (p. 4), GLIMMER (p. 9), MOD (pp. 10–11), DRY (p. 12), INFINITE and Infinite Input (p. 18), factory settings (p. 41).
- [PERfourMER MKII manual](https://archive.org/details/manualzilla-id-7445238): oscillator, filter, VCA and envelope (pp. 7–20).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): tempo (p. 62), gate and ties (p. 55), sequencer setup (p. 125).
