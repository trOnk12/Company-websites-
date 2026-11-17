---
title: Frozen sky
summary: A slow chord that rises into a shimmering cathedral, then freezes in place. You turn one knob and the frozen sky moves up or down in semitones, like playing a second instrument.
mood: Ambient pad you can play after it's frozen
level: Easy
time: 10 min
key: A minor, chords Am and F
order: 2
---

## What you'll hear

A soft three-voice chord, slowly wobbling. The reverb climbs an octave on every pass, like a choir. Then you freeze it, and turn the frozen cloud up and down while the bass keeps going.

**The trick:** the NightSky's SIZE/PITCH knob also changes the pitch of audio it's holding. Freeze a chord, and that knob becomes a transpose control.

## 1. PERfourMER: a three-voice pad

Put synth channels **1, 3 and 4** on MIDI channel 1 (see the rig page), and set **PLAYMODE** to **P1**: those three channels now play chords. Set all three the same:

```settings
PLAYMODE :: [M1|M2|*P1*|P2|D1|D2] :: Poly 1: each note of a chord gets its own channel, up to three here.
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Full and warm once filtered.
OCTAVE :: 8' :: Middle register.
CUTOFF :: 10 o'clock :: Fairly closed: soft.
RESONANCE :: 9 o'clock :: Barely.
Filter LFO INT :: 9 o'clock :: The LFO moves the filter a little: the pad breathes.
LFO WAVE :: [S&H|*sine*|saw or square] :: A smooth sweep.
LFO SPEED/PHASE :: 9 o'clock :: Slow.
VCA MODE :: [*EG*|GATE|ON] :: The envelope shapes the volume.
ATTACK :: 1 o'clock :: Slow fade-in: no attack at all.
DECAY :: noon :: Gentle.
SUSTAIN :: 2 o'clock :: The chord holds while the note is held.
RELEASE :: 2 o'clock :: A long fade when the chord ends.
PAN :: noon :: In the main left output, which feeds the pedals.
```

## 2. Grand Canyon: a slow wobble

```settings
DELAY TYPE :: MOD :: Digital delay with a moving delay time: chorus and vibrato.
DELAY :: 7:30 o'clock :: Near the minimum: you hear thickness, not echoes. If you hear separate echoes, turn it further left.
FEEDBACK :: 9 o'clock :: Very few repeats.
MOD RATE (left mini knob) :: 9 o'clock :: Slow movement.
MOD DEPTH (right mini knob) :: 11 o'clock :: A wobble you feel more than hear.
DELAY LVL :: 11 o'clock :: Under the dry signal: a thickener.
PING PONG :: [off|*on*] :: Repeats alternate left and right: wider.
```

## 3. NightSky: the cathedral

```settings
TEXTURE :: [sparse|*dense*|diffuse] :: Plate-like and dense; at long decays it turns ambient.
LENGTH :: 3 o'clock :: Very long tail.
SHIMMER (button) :: [input|*regen*] :: Shimmer inside the core: each pass climbs again, ascending as it decays.
INTERVAL :: max :: +1 octave: the choir rises in octaves.
SHIMMER (knob) :: 10 o'clock :: A little shimmer goes a long way.
GLIMMER :: [*high*|low|off] :: A washy, dreamy top end.
QUANTIZE :: [smooth|*half step*|scale] :: SIZE/PITCH moves in semitones: needed for the trick in step 5.
SIZE/PITCH :: noon :: The middle of the range: no pitch change yet.
FILTER :: [*regen*|low pass] :: The tail darkens as it fades, so the shimmer doesn't pile up.
HIGH CUT :: 1 o'clock :: Keep some sparkle.
LOW CUT :: 10 o'clock :: Leaves room for the bass.
TARGET :: [*verb*|pitch|filter] :: Modulation moves the reverb itself.
SHAPE :: [*triangle*|square|ramp|saw|random|env] :: Even.
SPEED :: 9 o'clock :: Slow.
DEPTH :: 9 o'clock :: Subtle.
DRY :: noon :: Unity.
REVERB :: 2 o'clock :: The cloud is the main sound here.
```

## 4. The OXI One: play it

Sequencer 1 in **Poly** mode on Ch 1; sequencer 2 Mono on Ch 2 for the bass.

1. Tempo around 70 BPM: hold **Shift**, turn **knob 1**.
2. Sequencer 1: on step 1, tap three pads in the same column: a chord (for example A, C, E). Up to seven notes fit on one step.
3. Make the chord last the whole bar: for each note of the chord, hold its pad on step 1 and tap the same row on the bar's last step. That ties that note across the bar.
4. Make a second chord a bar later (F, A, C), tied the same way.
5. Sequencer 2 (the bass patch from the rig page): the root of each chord, A then F, low, tied across the bar.

## You got it right when

- The chord **rises an octave** in the reverb as it fades.
- After INFINITE, the cloud **stays** when the chord stops.
- Turning SIZE/PITCH moves the frozen cloud in **clean semitone steps**.

## 5. The performance: freeze and transpose

1. Let a chord ring, then press **INFINITE**. The cloud holds.
2. Turn **SIZE/PITCH**. With QUANTIZE on *half step* it moves in semitones. **Counter-clockwise goes up**, clockwise goes down, up to an octave each way. (The manual: minimum is up, maximum is down.)
3. Stop sequencer 1 first (the factory setting lets new chords pour into the frozen cloud). Then try +5 (a fourth) and +7 (a fifth) semitones over the bass: they usually fit.
4. Bring it back to noon, then press **INFINITE** again to let the sky melt away.

## If it sounds wrong

- **The frozen cloud doesn't move:** QUANTIZE is on *scale* with a scale that skips that note, or SIZE/PITCH is back at noon.
- **Too bright, almost a whistle:** SHIMMER knob down, or HIGH CUT left.
- **Chords cut off:** with three voices, a fourth note steals the oldest. Keep chords to three notes.

## Sources

- [NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): TEXTURE and SIZE/PITCH, including "adjusting SIZE/PITCH will change the pitch of the reverberated audio" (pp. 5–6), QUANTIZE ranges (p. 6), shimmer and INTERVAL (p. 8), GLIMMER (p. 9), INFINITE (p. 18).
- [Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): MOD delay type (p. 17), PING PONG (p. 11).
- [PERfourMER MKII manual](https://archive.org/details/manualzilla-id-7445238): combining channels and PLAYMODE P1 (pp. 25–27), LFO (p. 16).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): Poly sequencer, chords and ties (p. 132).
