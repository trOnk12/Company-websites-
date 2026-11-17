---
title: Sound recipes
summary: Music is my hobby. Here are recipes for one small rig, an OXI One MK2 sequencer, a Vermona PERfourMER MKII synth, an Electro-Harmonix Grand Canyon delay and a Strymon NightSky reverb, with every knob drawn where it should point, and lessons on the ideas behind the sounds, starting with FM on the Elektron Digitone II.
---

## The rig, wired once

Every recipe uses the same cables, so you wire it once and only turn knobs after that.

```settings
OXI One MIDI out :: → PERfourMER MIDI IN :: The OXI plays the synth. Set each OXI sequencer's output port to ALL (or the TRS port your cable uses).
PERfourMER main OUTPUT L :: → Grand Canyon INPUT :: Everything panned to the centre or left goes through the effects.
Grand Canyon L OUT and R OUT :: → NightSky LEFT IN and RIGHT IN :: Stereo from the delay into the reverb.
NightSky rear switch :: [INST|*LINE*] :: The manual says to use LINE with synthesizers: it adds 10 dB of clean headroom.
NightSky LEFT and RIGHT OUT :: → your mixer or interface :: The wet side of the rig.
PERfourMER channel 2 OUT :: → your mixer, dry :: The bass. Its own output skips the pedals.
PERfourMER channel 2 PAN :: max :: Fully right, so the bass stays out of the main left output that feeds the pedals. PAN doesn't affect a channel's own output, so the dry bass is untouched. Check once: with only channel 2 playing, the pedals should be silent.
```

## Before every recipe: back to neutral

Recipes only list what matters for that sound, so start each one from here. It takes about two minutes.

```settings
PERfourMER EG INT and LFO INT :: noon :: Centre on the oscillator and filter: no envelope or LFO movement until a recipe asks.
PERfourMER PLAYMODE :: [*M1*|M2|P1|P2|D1|D2] :: Plain mono unless a recipe says otherwise.
PERfourMER channels 3 and 4 VOLUME :: min :: Off unless a recipe uses them.
Grand Canyon secondary mode :: Off :: If the delay type's LED is blinking on PITCH or DRUM, hold PING PONG about 2 s to switch back.
Grand Canyon top-left buttons :: EXP MODE, MOMENT, TAILS and PING PONG all unlit :: Then press PING PONG only if a recipe asks.
Grand Canyon mode :: Only the DELAY LED lit :: Press the small white Mode button next to the DELAY and LOOPER LEDs until it is.
NightSky :: INFINITE off, not in Sequence mode (ON LED not red) :: Hold INFINITE to leave Sequence mode.
NightSky voice :: SHIMMER knob min, GLIMMER off, DRIVE off :: The colour effects start off; a recipe turns on what it needs.
NightSky MOD DEPTH :: min :: No modulation until a recipe asks.
NightSky DRY :: noon :: Unity: the dry signal at its own level.
```

## Levels, once

1. Play a chord through the pedals with everything at neutral. If the Grand Canyon sounds crunchy on loud notes, turn the PERfourMER's **MASTER VOLUME** down: it sets the main output that feeds the pedals. Three voices playing together (P1 or M2 recipes) are louder than one.
2. Set the bass level on your mixer so it sits under the wet side, not over it.

## The bass: synth channel 2

Every recipe's sequencer 2 plays this patch on channel 2, unless the recipe gives its own.

```settings
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Full, warm once filtered.
OCTAVE :: 16' :: Low.
CUTOFF :: 10 o'clock :: Round, not buzzy.
RESONANCE :: 9 o'clock :: A little body.
Filter EG INT :: 1 o'clock :: A small punch at each note.
VCA MODE :: [*EG*|GATE|ON] :: The envelope shapes it.
ATTACK :: min :: Instant.
DECAY :: noon :: Medium.
SUSTAIN :: 1 o'clock :: Holds while the note is held.
RELEASE :: 10 o'clock :: A short fade.
VOLUME :: 2 o'clock :: Then set the level on your mixer.
PAN :: max :: Keeps it out of the pedals (see the wiring above).
```

## How to read a recipe

- A **knob drawing** shows where to point the knob, as on a clock: 7 o'clock is fully left, noon is the middle, 5 o'clock is fully right. The blue arc is how far you've turned it.
- A **row of words** is a button or switch: the dark one is the setting.
- Each setting has one line of **why** under it. Read it once; after that, the drawings are enough.
- Tap a row to tick it off as you set it; the ticks are saved in your browser. **Hide the whys** turns a recipe into a one-screen cheat card.
- The Grand Canyon's two **mini knobs** are named in the table printed under them, for each delay type. Stepped positions are counted from fully left.
- The positions are my starting points: tune them by ear. What each control *does* is checked against the manual, linked at the bottom of every recipe.

## Set up the PERfourMER's MIDI channels (once)

1. Press **MIDI CH**.
2. Turn **SELECT/SEQ** to channel **1**, then press the **TRIG** button of synth channel 1 (and of channels 3 and 4 when a recipe asks for them).
3. Turn **SELECT/SEQ** to channel **2**, then press the **TRIG** button of synth channel 2.
4. Press **MIDI CH** again to leave.

On the OXI One: hold **Shift** and tap sequencer **1**. On page 1 of its setup, set **Ch** to 1. Do the same for sequencer **2** with **Ch** 2. To pick a sequencer's mode (Mono, Poly…), turn **knob 4** on that page and press it to confirm.

## Sources

- [Electro-Harmonix Grand Canyon user manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf)
- [Strymon NightSky user manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf)
- [Vermona PERfourMER MKII owner's manual](https://archive.org/details/manualzilla-id-7445238)
- [OXI One MKII user manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html)
