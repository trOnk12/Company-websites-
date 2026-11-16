---
title: Sound recipes
summary: Music is my hobby. These are recipes for one small rig, an OXI One MK2 sequencer, a Vermona PERfourMER MKII synth, an Electro-Harmonix Grand Canyon delay and a Strymon NightSky reverb, with every knob drawn where it should point.
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

## How to read a recipe

- A **knob drawing** shows where to point the knob, as on a clock: 7 o'clock is fully left, noon is the middle, 5 o'clock is fully right. The blue arc is how far you've turned it.
- A **row of words** is a button or switch: the dark one is the setting.
- Each setting has one line of **why** under it. Read it once; after that, the drawings are enough.
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
