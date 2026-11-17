---
kind: lesson
shelf: FM, from one sine
title: FM on the Digitone, from one sine
summary: FM sounds like magic until you see what it does: one sine shakes another so fast that the shaking turns into new overtones. Ten small steps on the Digitone II, each with a sound you can play right here and a drawing of the overtones it makes, so every knob on the FM TONE pages ends up meaning something.
mood: FM that feels like a synth you already know
level: Beginner, no maths
time: 45 min
device: Digitone II, FM TONE machine
sound: fm
order: 0
---

## The map before the trip

You already know a subtractive synth: an oscillator makes a rich tone, a filter takes some of it away, an amp shapes the volume. The Digitone II keeps the filter and the amp. The manual says it plainly: it uses FM "more like a complex tone generator", and the rest of the voice is "more similar to a typical subtractive synth".

So FM replaces the oscillator, and it doesn't take overtones away, it **makes** them. Four knobs do almost all of it, and each one maps to something you already have a feel for:

| On the Digitone | What it does to the overtones | Feels like |
|---|---|---|
| **LEV A** (and LEV B) | how many overtones appear | opening a filter |
| **RATIO A** | which overtones: in tune or clangy | choosing a waveform |
| **The A envelope** (ATK, DEC, END) | how the overtones change over a note | a filter envelope |
| **FDBK** | extra grit on the modulator | a buzzier waveform |

The rest of this page earns that table, one knob at a time. Every step has a box where you can **play the idea in your browser**, with a drawing of the overtones it makes (the spikes), and then the same idea on the Digitone.

## How to read this lesson

- **Grey screen boxes** are the Digitone's parameter pages, drawn in the same places as the knobs. A value in a **dark box** is the one this step changes.
- A value with **≈** is my starting point, to tune by ear. Values without it, names and ranges come from the Digitone II manual (OS 1.12).
- **Play it here** boxes make sound with your browser. Start them quietly: the first click sets the volume.
- Each step ends with a **check**. Answer it in your head before you open it.

## 0. Start clean

Pick an empty track. Clear its preset with **[TRK] + [PLAY]**, then make sure the machine is **FM TONE**: **[FUNC] + [SYN]** opens the MACHINE menu; choose **FM TONE** and press **[YES]**.

Now set these, so we all start from the same sound. Press **[SYN]** for page 1, and again (or **[DOWN]**) for page 2.

```digitone SYN 1 · FM TONE
ALGO :: *1* :: Algorithm 1. The picture on the screen shows A with a little loop on its corner, sitting on C, and C's line going to X. A shakes C; you hear C.
RATIO C :: *1.00* :: C plays the note you play.
RATIO A :: *1.00* :: A runs at the same pitch, for now.
RATIO B :: as it is :: Not used until step 9.
HARM :: *0.00* :: Plain sine waves (HARM is step 10).
DTUN :: *0* :: No detune.
FDBK :: *0* :: No feedback (step 8).
MIX :: *X* :: Turn it all the way to the X end, until the screen's slider sits at X: you hear only C's output.
```

```digitone SYN 2 · FM TONE
ATK A :: *0* :: The A envelope starts at once.
DEC A :: *0* :: No fall.
END A :: *127* :: It stays fully open, so LEV A alone sets how hard A shakes C. (Step 7 makes it move.)
LEV A :: *0* :: No shaking yet. This is the knob of the whole lesson.
ATK B :: as it is ::
DEC B :: as it is ::
END B :: as it is ::
LEV B :: *0* :: B doesn't shake anything yet, and with MIX at X you don't hear B1's own output either.
```

```digitone SYN 3 · FM TONE
ADEL :: as it is ::
ATRG :: *ON* :: Trigged: on every note the A envelope runs attack, decay, end by itself, whatever the note's length. Step 7 needs this.
ARST :: *ON* :: Each note restarts the envelope from zero.
PHRT :: as it is ::
BDEL :: as it is ::
BTRG :: as it is ::
BRST :: as it is ::
```

```digitone SYN 4 · FM TONE
RATIO OFFSET C :: *0* :: Offsets nudge a ratio off its value. At 0, "whole number" really means whole.
RATIO OFFSET A :: *0* ::
RATIO OFFSET B1 :: *0* ::
RATIO OFFSET B2 :: *0* ::
KEY TRACK A :: *0* :: Otherwise higher keys get less shaking, which would skew step 2.
KEY TRACK B1 :: *0* ::
KEY TRACK B2 :: *0* ::
```

On the **FLTR** page, open the filter, so it doesn't hide what FM does: **FREQ** fully up, **ENV** at 0, and if it's the MULTI-MODE filter, **TYPE** fully to lowpass. On FLTR page 2, the base-width filter is out of the way with **BASE** at 0 and **WDTH** at 127. On the **AMP** page, set **MODE** to **AHD** and **HOLD** to **NOTE**: the sound then lasts as long as you hold a key.

Press **[KEYBOARD]** so the trig keys play notes, and hold one down.

## 1. One sine

**Why it exists.** You can't hear what FM adds until you've heard what's there before it.

> **One idea.** A sine wave is one pitch and nothing else: one spike in the drawing.

What you hear now is operator **C**, alone, a pure sine. It sounds like a soft flute or a test tone: round, a bit dull. That dullness is the point: there are no overtones yet. A **spike** is one pure frequency, like one singer holding one note; the drawing below the player shows each spike as a line, taller when louder.

```fm
title: One sine
ratio: 1
depth: 0
lock: depth, ratio
```

```check
In the drawing, why is there only one line?::Because a sine is a single frequency. Every other sound is made of several sines at once: several spikes.
```

## 2. When vibrato turns into tone

**Why it exists.** FM sounds like a mystery. It isn't: it's vibrato, played very fast.

> **One idea.** Shake a note's pitch slowly and you hear vibrato. Shake it hundreds of times a second and you can't follow the wobble any more: you hear a new tone colour instead.

The manual says the same: "At slower modulation rates, it is simply vibrato, but when the modulating frequency reaches audio rate, the vibrato effects becomes a part of the sound". The sine that shakes is the **modulator** (A); the sine being shaken is the **carrier** (C), because it carries the note to your ears.

Slide the speed up slowly. Somewhere around 15 to 20 shakes per second, roughly, the wobble stops being a wobble.

```fm
title: Vibrato, faster and faster
ratio: 1
mode: rate
rate: 4
depth: 2
lock: depth
```

On the Digitone you can hear the same thing, because A's speed follows the key you play.

```digitone SYN 1 · FM TONE
RATIO C :: *4.00* :: C now sounds two octaves above the key, so even very low keys stay audible.
RATIO A :: *0.25* :: As low as it goes (0.25 is the lowest the manual gives for group B; check A on your unit). A shakes at a quarter of the key's pitch: on a very low key, a few shakes per second.
```

```digitone SYN 2 · FM TONE
LEV A :: *≈30* :: Enough shaking to hear it clearly.
```

Press **[−]** until the keyboard is 3 or 4 octaves down, and play a **C**: slow vibrato. Now press **[+]** and play C again, octave by octave. Each octave doubles A's speed: vibrato, then a flutter, then a growl, then simply a different sound. Nothing changed but the speed. (If the slow vibrato on the lowest octaves is hard to hear, raise LEV A a little there.)

```check
You play one octave higher. What happens to A's shaking speed, and why?::It doubles. RATIO A is a multiple of the note you play, so A's speed follows the key, like C's pitch does.
```

Put **RATIO C** and **RATIO A** back to **1.00** and **LEV A** back to **0** before the next step.

## 3. Where the new tone comes from

**Why it exists.** "It's vibrato, but fast" explains the sound. The spikes explain how to *control* it.

> **One idea.** Shaking a carrier at a modulator's frequency adds new spikes on both sides of the carrier, spaced exactly by the modulator's frequency.

These new spikes are called **sidebands**. A carrier at 220 shaken at 50 per second gets sidebands at 170 and 270, then 120 and 320, and so on outwards. Think of a singer (the carrier) with a friend shaking her shoulder (the modulator): the faster the friend shakes, the further apart the extra voices you hear.

In the slow vibrato of step 2, the sidebands were only a few hertz apart, too close to hear as separate notes: they blur into one wobbling pitch. Once they're far apart, you hear them as overtones.

```fm
title: The modulator sets the spacing
ratio: 1
mode: rate
rate: 50
depth: 1.5
lock: depth
```

```check
The carrier is at 300, the modulator at 100. Where are the first two sidebands?::At 200 and 400: one modulator-step below and above the carrier. The next ones are at 100 and 500.
```

## 4. LEV: how many overtones

**Why it exists.** You need a way to go from "a sine" to "very bright" smoothly, like opening a filter.

> **One idea.** LEV sets how hard the modulator shakes the carrier. Gentle shaking makes only the nearest sidebands; harder shaking spreads energy further out, into more and higher sidebands.

This is FM's brightness knob. With RATIO C and RATIO A both at 1.00, turn **LEV A** up slowly while you hold a note: sine, then warmer, then brassy, then harsh. The manual describes this 1:1 setting as "sounds like a sawtooth".

```digitone SYN 2 · FM TONE
LEV A :: *0 → 127* :: Turn it slowly while holding a note. Stop at the brightness you like; around a third is already rich.
```

```fm
title: LEV is brightness
ratio: 1
depth: 0
lock: ratio
```

Notice in the drawing that the spikes don't grow in order: as you push the depth, some spikes swell, shrink and come back. That's why sweeping LEV sounds like a moving filter with a voice of its own, not a plain one.

```check
LEV A is at 0 and you hear a pure sine. Is that because A isn't running?::No: A is running, it just isn't shaking C. LEV is the amount of shaking, not an on/off for the operator.
```

## 5. RATIO: which overtones

**Why it exists.** LEV says *how many* spikes. You still need to choose *where* they land, and that is what makes one FM sound a bass and another a bell.

> **One idea.** RATIO A sets the modulator's speed as a multiple of the note, and that speed is the spacing between spikes. Whole-number ratios put every spike on the note's own ladder of harmonics; other ratios put them between the rungs.

A note's **harmonics** are the frequencies at 1, 2, 3, 4… times the note: a ladder. Anything with a clear pitch, a voice, a string, a sawtooth, has its spikes on that ladder. The faint lines in the drawing are the ladder's rungs.

Keep **LEV A** around a third and try three ratios:

```digitone SYN 1 · FM TONE
RATIO A :: *1.00, then 2.00, then off the ladder* :: 1.00: every rung, a full, saw-like tone. 2.00: hollow, like a square or a clarinet. Then leave the ladder: nudge RATIO OFFSET A (SYN page 4) a little off 0, or use DTUN: a bell, or metal.
```

```fm
title: Ratio picks the rungs
ratio: 2
depth: 1.5
choices: 1, 2, 3, 0.5, 1.5, 1.41
lock: depth
```

**Why 2.00 sounds hollow.** The carrier is at 1, and the spikes step by 2: 1, 3, 5, 7 upwards, and −1, −3, −5 downwards. A spike can't sit below zero, so the negative ones **fold back** onto 1, 3, 5. Only odd rungs ever get a spike, and a tone with only odd harmonics is exactly what makes a square wave hollow. The manual: "a ratio of 1:2 (carrier:modulator), the carrier output resembles a square wave".

**Why 1.41 rings like a bell.** Steps of 1.41 never land on the rungs: the spikes sit between the harmonics, so your ear can't add them up to one clear pitch. Real bells and metal bars ring the same way.

**Halves are a trap.** Try 1.5 or 0.5 in the player: the spikes land halfway between the rungs, but always on the *same* halfway points. That's the ladder of a note an octave lower, so you hear a pitch, often lower or hollow, not a bell. To really leave the ladder, the ratio has to be "untidy", which on the Digitone is what RATIO OFFSET and DTUN are for.

```check
RATIO C is 1.00 and RATIO A is 3.00. Will it sound in tune or clangy?::In tune. Steps of 3 from a carrier at 1 land on 1, 4, 7… and fold back from −2, −5 onto 2, 5: all whole rungs, so it stays on the ladder (every third rung is just missing). When the manual says odd numbers give "metallic or other natural sounds", it's describing that character, not leaving the ladder.
```

## 6. Who is the boss: C or A

**Why it exists.** Both C and A have a RATIO. Which one sets the note you hear?

> **One idea.** C is the carrier: its ratio sets the pitch you hear. A only colours it.

The manual: C "always works like a carrier, is limited mostly to integers since it is generally used for carrying the base note of the sound", while A "has a more extensive number of ratio values to allow for more inharmonic relationships". So:

- Change **RATIO C** to **2.00**: the pitch jumps an octave, and the colour changes too, because A didn't move with it.
- Change **RATIO A**: the pitch stays; the colour changes.

A useful habit: keep C on a whole number and do your colouring with A.

```check
You want the same bell an octave higher. Do you change RATIO C or RATIO A?::Better to play the key an octave up, or double both ratios. Doubling only C changes the C:A relation, and with it the colour.
```

Set **RATIO C** back to **1.00**.

## 7. The A envelope: brightness that moves

**Why it exists.** Real instruments don't keep the same brightness: a plucked string is bright for a moment, then mellow. A fixed LEV can't do that.

> **One idea.** The A envelope moves the shaking over time. LEV A is the ceiling; ATK, DEC and END shape the path. It works exactly like a filter envelope, only it adds overtones instead of letting them through.

The manual uses the same picture: "A piano for example, when first struck, the timbre is sharp but quickly fades to a softer tone." The envelope rises (ATK), falls (DEC) and stops at **END**, a level it holds until the note ends. Setting END to 0 makes the overtones die completely.

```digitone SYN 1 · FM TONE
RATIO A :: *3.00* :: In tune, bright.
```

```digitone SYN 2 · FM TONE
ATK A :: *0* :: The brightness is there at once…
DEC A :: *≈40* :: …and falls away quickly…
END A :: *0* :: …down to a plain sine.
LEV A :: *≈90* :: A hard, bright start.
```

On the **AMP** page, set **HOLD** to a short value (≈10) and **DEC** to about ≈60, so each note fades by itself. Play a few notes: a pluck, bright then soft, like a harp or an electric piano.

```fm
title: A pluck: brightness that falls
ratio: 3
depth: 4
mode: pluck
lock: ratio
```

```check
The pluck is too clicky. Do you lower LEV A or lengthen DEC A?::Lower LEV A to make the start less bright; lengthen DEC A to make the brightness last longer. They're the ceiling and the speed of the fall.
```

## 8. FDBK: the modulator's own grit

**Why it exists.** Sometimes you want a sound that's buzzier, more like a raw sawtooth, without adding operators.

> **One idea.** Feedback makes an operator shake itself. Its sine turns into a brighter, saw-like wave, and that richer wave then shakes the carrier.

In algorithm 1 the feedback sits on **A**: that's the little loop on A's corner in the screen's picture. The manual: feedback "is usually only applied to modulators", and the factory sounds **B001** and **B002** show "how feedback is used to create a basic square and saw waveform".

Go back to **RATIO A 1.00**, **LEV A** about a third, the A envelope fully open (**END A 127**), and AMP **HOLD** back to **NOTE**, so notes last while you hold them. Then:

```digitone SYN 1 · FM TONE
FDBK :: *0 → up* :: Turn it slowly. A little: edge. More: buzz. A lot: noise.
```

```check
With LEV A at 0, does FDBK change the sound?::Hardly. FDBK changes A's own wave, but with LEV A at 0, A isn't shaking C at all. Feedback needs some LEV to be heard.
```

## 9. Reading any algorithm

**Why it exists.** There are eight algorithms. You don't need to learn them by heart: the screen draws each one, and two rules read any of them.

> **One idea.** A box with a line going down to **X** or **Y** is a carrier: you hear it. A box sitting on top of another box shakes it: it's a modulator. LEV A and LEV B set how hard the A and B groups shake.

Group **B** is two operators, **B1** and **B2**, set together. Two things are special about it:

- **RATIO B** shows two numbers and turns like a watch: B2, the fast hand, climbs through every ratio up to 16, then B1, the slow hand, moves up one value, and B2 starts over from 0.25.
- **LEV B** isn't one amount, it's a morph. From 0 to 43 only **B1** fades in; from 43 to 85 B1 fades back out while **B2** fades in; above 85 B2 stays up and B1 comes back.

Here is algorithm 1, as the screen draws it:

```algo
A 0 0 fb
C 0 1
B2 1 -1
B1 1 0
A>C
B2>B1
B1>C
C>X dotted
B1>Y dotted
```

B2 sits on B1, and B1 has a line to C as well as its own line to **Y**. So with **LEV B** at about **43**, B1 alone shakes C too: a second set of spikes on top of A's.

```digitone SYN 1 · FM TONE
RATIO B :: *B1 2.00* :: Turn RATIO B until B1, the slow hand, reads 2.00. B2, the fast hand, doesn't matter here: at LEV B 43 it's silent.
```

```digitone SYN 2 · FM TONE
ATK B :: *0* :: Open the B envelope fully, like A's in step 0…
DEC B :: *0* ::
END B :: *127* :: …so LEV B alone sets the shaking.
LEV B :: *≈43* :: B1 at full strength, B2 still silent: a second modulator on C.
```

Now turn **MIX** slowly from X towards Y. **MIX** cross-fades between the two carrier outputs: here, from C (shaken by A and B1) to B1's own tone. The manual: each algorithm "has two carrier outputs (X and Y)", and MIX lets you "cross-fade between two separate timbres". Two sounds in one track.

When you're done, set **LEV B** back to **0** and **MIX** back to **X** for the last step.

```check
On the screen, a box has another box on top of it and a line down to Y. What is it?::Both: a carrier (its line goes to Y, so you hear it) and something being shaken (the box on top modulates it).
```

## 10. HARM: more than sine waves

**Why it exists.** Until now every operator was a sine. The Digitone II can give them richer waves.

> **One idea.** HARM adds overtones to the operators' waves. Below 0 it changes C; above 0 it changes A and B1.

The manual: "Negative parameter values change the harmonics of operator C, while positive parameter values change the harmonics of operators A and B1", and in-between values sweep smoothly, "much like in wavetable synthesis". A richer carrier is already bright before any LEV; a richer modulator makes every sideband into a little family of its own.

```digitone SYN 1 · FM TONE
HARM :: *0 → −26, then 0 → +26* :: Sweep each way with LEV A at 0, then again with LEV A up. Hear how much faster the sound gets bright.
```

```check
LEV A is at 0 and HARM is at +20. Do you hear a change?::Little or none. Positive HARM changes A and B1, which you only hear through their shaking (LEV), or through MIX if they're carriers. Negative HARM changes C, which you always hear.
```

## Ear test: match it

Each round plays a hidden FM sound. Find its **ratio** and **depth** with the controls, then check. Use the drawing: count the spikes and see whether they sit on the rungs.

```fm
title: Match the sound
mode: match
targets: 1@1.2, 2@1.5, 3@2.5, 1.41@2, 1@3.5
```

## Your first patch: a glass pluck

Everything above, in one sound. Start from step 0, then:

```digitone SYN 1 · FM TONE
ALGO :: *1* :: A on C, as in the whole lesson.
RATIO C :: *1.00* :: The note.
RATIO A :: *3.00* :: Bright and in tune…
FDBK :: *≈10* :: A touch of edge.
```

```digitone SYN 4 · FM TONE
RATIO OFFSET A :: *≈ a small nudge* :: …then a little off the ladder: glassy, a little bell.
```

```digitone SYN 2 · FM TONE
ATK A :: *0* :: Bright at once.
DEC A :: *≈50* :: The shine fades…
END A :: *≈20* :: …but some stays.
LEV A :: *≈70* :: How bright the start is.
```

On the **AMP** page: **HOLD** ≈10, **DEC** ≈70. On the **FX** page, send a little to **REV** and **DEL**. Play a slow melody in the middle of the keyboard. Then set **RATIO OFFSET A** back to 0 and up again: in tune, then glassy again. You know why now.

## The cheat card

| You want | Turn |
|---|---|
| brighter or darker | LEV A (or LEV B) |
| in tune ↔ bell or metal | RATIO A: whole numbers ↔ in between |
| hollow, square-like | RATIO A at 2.00 (C at 1.00) |
| a pluck, a piano, a bass with bite | the A envelope: ATK 0, short DEC, low END |
| a slow swell of brightness | the A envelope: long ATK |
| grit and buzz | FDBK |
| the same colour, another pitch | the key you play, not RATIO C |
| two sounds in one track | MIX between X and Y |

## If it sounds wrong

- **Turning LEV A does nothing:** MIX isn't at X, so you hear the other carrier; or the A envelope is closed (END A at 0 with a finished DEC); or KEY TRACK A is high and you're playing high notes.
- **Everything is out of tune:** RATIO C isn't a whole number, or RATIO OFFSET C (SYN page 4) isn't 0.
- **It beats or clangs when it shouldn't:** DTUN is up (it pushes A and B2 off their ratios), or RATIO OFFSET A isn't 0.
- **The sound is dull whatever you do:** the filter is closing it: FREQ fully up, ENV at 0, TYPE at lowpass; on FLTR page 2, BASE 0 and WDTH 127.
- **The notes are short:** AMP MODE is AHD with a small HOLD. Set HOLD to NOTE while you're exploring.

## Sources

- [Digitone II user manual, OS 1.12](https://www.elektron.se/wp-content/uploads/2026/10/Digitone-2-User-Manual_ENG_OS1.12_261008.pdf): FM TONE parameters, pages 1 to 4 (pp. 89–93); the FM synthesis appendix: overview and "it is simply vibrato" (p. 106), the eight algorithms and X/Y outputs (p. 107), ratios, including 1:2 and 1:1 (pp. 107–108), operator envelopes and the LEV B graph (pp. 108–109), HARM (pp. 109–110), ratio offsets and key track (p. 93), the base-width filter (p. 60); machine selection (p. 89); [TRK] + [PLAY] clears a preset, [KEYBOARD] and octave keys (key combinations and keyboard mode chapters).
- The spike drawings on this page are computed, not drawn by hand: a sine carrier shaken by a sine modulator has sidebands at the carrier ± whole multiples of the modulator, with heights given by Bessel functions of the depth; spikes that would fall below zero fold back with their sign flipped. The depth slider here is a physics depth, not the Digitone's LEV scale: they move the same way, but the numbers don't match.
