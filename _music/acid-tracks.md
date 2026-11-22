---
kind: breakdown
shelf: Acid Tracks
title: Acid Tracks
artist: Phuture
year: 1987
listen: https://music.apple.com/us/album/acid-tracks/885922990?i=885922991
summary: The record that named acid house: a Roland TB-303 bass machine whose filter knobs DJ Pierre turned while the pattern ran. The idea we take from it is that the performance is the knobs, not the notes.
order: 5
---

## Listen first

Play it on [Apple Music](https://music.apple.com/us/album/acid-tracks/885922990?i=885922991) (the Trax release, about 12 minutes).

- Listen to the bassline's tone, not its notes: it keeps changing while the pattern repeats. That is Pierre turning the 303's knobs.
- Listen for loud, bright notes and notes that slide into the next: those are the 303's ACCENT and SLIDE, written into the pattern.
- Listen to the drums dropping in and out: Spanky was "dropping beats in and out" while Pierre turned knobs.
- The tempo is about 120 BPM: Pierre says they slowed it from 128 on Marshall Jefferson's advice.

## The structure

No source gives section timings, so there is no timeline here. The structure *is* the jam: "Spanky was dropping beats in and out, I'm twisting knobs. So, it was like a jam session and we recorded the whole thing." The first cassette version ran "literally 15 minutes". Phuture later re-recorded it in a studio with Marshall Jefferson, who "mixed the track as far as setting levels and stuff. But as far as producing, he didn't add any new sounds to it".

## What the artist used

```gear
Roland TB-303 Bass Line :: The acid line; Spanky bought it second-hand for "like, $40" :: https://daily.redbullmusicacademy.com/2012/12/dj-pierre-interview
Roland TR-707 and TR-727 :: The drums: "the 707/727 combo featured prominently on the 'Acid Tracks' beat" :: https://articles.roland.com/lifetime-achievement-dj-pierre-and-phuture/
A cassette deck :: The first version was recorded live to cassette and given to Ron Hardy :: https://daily.redbullmusicacademy.com/2012/12/dj-pierre-interview
```

## How each part is made

### The 303 line: turning knobs while it plays

DJ Pierre: "He already had a beat plan, but we didn't know how to programme it. We had it synched up, and it was playing some stuff, and I started just tweaking knobs and turning stuff, and Spanky was like, 'Woah woah woah. Keep doing that, keep doing that.'" Roland's interview names the knobs: "Pierre twisted the machine's knobs, altering the frequency and resonance of the 303 basslines."

**What those knobs do (TB-303 owner's manual, the instrument's documented behaviour):**

- **CUTOFF FREQ** "controls the tone colour. By turning it counter-clockwise, it will begin to shave off the upper harmonics of the sound making the tone softer and reducing the volume."
- **RESONANCE** "emphasizes certain frequencies. The effect will become stronger when this knob is rotated clockwise."
- **ENV MOD** "controls the tone movement of a note"; **DECAY** "controls the time a note takes to fade".

**Why it works:** a resonant low-pass filter emphasises the frequencies right at its cutoff (the PERfourMER manual says the same of its own filter: resonance "emphasizes the cut-off frequency"). Sweep the cutoff while the notes repeat and that emphasised band moves through the sound, so the same pattern keeps changing colour. Pierre's stated reason is simpler: "It was like, that 303 and I connected".

The notes of the pattern are not documented in any source we fetched, so there is no step grid here.

### Accent and slide

The TB-303 stores, per note, "particular features of Bass instruments, like accent or portamento (slide)". The manual's rules for slide: "To slide from one note to another, write the slide on the first of the two notes", "if there is a rest between the two notes, the slide effect does not work", and "If you write a slide between two notes of the same pitch, the result is a 'TIED' note." The ACCENT knob sets how strong the written accents are. Which notes in "Acid Tracks" carry accents or slides is not documented.

### Was it an accident?

Pierre's own account is that they didn't know how to program the machine and found the sound by turning knobs; he calls the experience "quite spiritual". We don't add more intent than that.

### Tempo

"I remember at the time we had 'Acid Tracks' going like 128. I remember Marshall saying, 'Pierre, you need to slow that down because they're not going to play that in New York.'" ... "we listened, slowed it down to 120."

## Rebuild it on my rig

**This is our rebuild, not the original.** The PERfourMER is not a TB-303: it has a 24 dB/octave Moog-type filter, and its velocity input changes only the loudness envelope, so our "accent" is a louder note. The 303 manual doesn't say what its accent changes beyond "the accent of the Bass Pattern", so we don't claim to match it. Every control does what its manual says; the positions are our starting points. Pedals at neutral: Phuture used none that we know of.

## 1. PERfourMER: an acid voice (channel 1)

```settings
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Our choice. The 303 has two waveforms; which one Phuture used isn't documented.
OCTAVE :: 16' :: Bass register.
CUTOFF :: 9 o'clock :: Start dark: this is the knob you'll play.
RESONANCE :: 2 o'clock :: Strong. The manual: resonance "is regularly used for resonant bass sounds in Acid-House and Techno" (p. 13). Above 3 o'clock it self-oscillates.
Filter EG INT :: 2 o'clock :: Each note opens the filter: the 303's ENV MOD job (manual p. 13).
VCA MODE :: [*EG*|GATE|ON] :: The envelope shapes each note.
ATTACK :: min :: Instant.
DECAY :: 10 o'clock :: Short: the 303's DECAY job, how long a note takes to fade.
SUSTAIN :: min :: Notes don't hold.
RELEASE :: 8 o'clock :: Short.
GLIDE :: 9 o'clock :: A short slide time. With AUTO GLIDE (below) it only happens between overlapping notes, like a 303 slide.
PAN :: noon :: Main output.
```

**Three edit settings for channel 1** (press **EDIT**, turn **SELECT/SEQ** to the number, press channel 1's **TRIG** so its LED lights, press **EDIT** to leave; manual pp. 29–30):

- **4 VELOCITY** on: velocity changes the envelope's amount on the VCA. Our accent.
- **5 AUTO GLIDE** on: "a glide (portamento) will only be performed with two adjacent notes being played overlapping." Our slide.
- **6 LEGATO** on: overlapping notes don't restart the envelope, so a slid note doesn't re-pluck.

## 2. OXI One: accents and slides

1. Tempo **120**: hold **Shift**, turn **knob 1**.
2. Sequencer 1, Mono, Ch 1: a one-bar line, low notes, some rests. Write your own; the original's notes aren't documented.
3. **Accents:** set a low global velocity with **knob 1**, then on the notes you want accented hold the step and turn **knob 1** up (OXI manual p. 54).
4. **Slides:** on the *first* of two notes (the 303 rule), set its gate to **LEG**: the manual says "a note can be set to LEG - Legato to create a seamless pitch glide between sequential notes" (p. 55). Hold the step and turn **knob 3** (Gate). Leave no rest between the two notes, or (as on the 303) there's nothing to slide into.

## 3. The performance

Play the pattern and turn **CUTOFF** and **RESONANCE** slowly while it runs, as Pierre did. Then try **DECAY** and **Filter EG INT**. Keep RESONANCE below 3 o'clock unless you want the filter to whistle on its own.

## 4. Drums

Phuture's beat was a TR-707 and TR-727; the pattern isn't documented. On the Digitone II (wiring as on the Planet Rock page), program a kit by ear and do Spanky's job: mute and unmute parts while the 303 line runs.

## What needs your ears

- The notes, accents and slides of the 303 pattern.
- The drum pattern and which parts come and go.
- Whether our slides really glide: if the OXI's LEG doesn't send overlapping notes, the PERfourMER's AUTO GLIDE won't fire. Try it once; if there's no glide, turn AUTO GLIDE off (then every note glides by the GLIDE time).

## Sources

- ["The Story Of Acid House: As Told By DJ Pierre"](https://daily.redbullmusicacademy.com/2012/12/dj-pierre-interview), *Red Bull Music Academy*, December 2012: "This guy named Jasper G ... And he said, 'A Roland TB-303.'" · "he went out and got one for, like, $40. He said, 'Oh, I found it in the secondhand shop'" · "he already had a beat plan, but we didn't know how to programme it. We had it synched up, and it was playing some stuff, and I started just tweaking knobs and turning stuff, and Spanky was like, 'Woah woah woah. Keep doing that, keep doing that.'" · "The funny thing is, that first day, we made 'Acid Tracks'. It was quite spiritual, to be honest. It was like, that 303 and I connected" · "We recorded on a cassette tape" · "And the track was literally 15 minutes long." · "Spanky was dropping beats in and out, I'm twisting knobs. So, it was like a jam session and we recorded the whole thing." · "at the time we had 'Acid Tracks' going like 128. I remember Marshall saying, 'Pierre, you need to slow that down because they're not going to play that in New York.'" · "we listened, slowed it down to 120. He gave us good advice and he mixed the track as far as setting levels and stuff. But as far as producing, he didn't add any new sounds to it or anything like that."
- Gino Sorcinelli, ["Lifetime Achievement: DJ Pierre and Phuture"](https://articles.roland.com/lifetime-achievement-dj-pierre-and-phuture/), *Roland Articles*, March 2022: "During one fateful session, Pierre twisted the machine's knobs, altering the frequency and resonance of the 303 basslines." · "In particular, he notes the TR-707 and TR-727 he and Phuture used early on." · "You can hear the 707/727 combo featured prominently on the 'Acid Tracks' beat." · "'Acid Tracks' already had a major buzz when Phuture rerecorded it in a proper studio with Marshall Jefferson. The group officially pressed it on Trax Records in 1987."
- [Roland TB-303 owner's manual](https://archive.org/details/synthmanual-roland-tb-303-owners-manual) (scan): "particular features of BAss instruments, like accent or portamento (slide), can be written into memory where needed." · Tone control section: CUTOFF FREQ "This knob controls the tone colour. By turning it counter-clockwise, it will begin to shave off the upper harmonics of the sound making the tone softer and reducing the volume." RESONANCE "Resonance emphasizes certain frequencies. The effect will become stronger when this knob is rotated clockwise." ENV MOD "This knob controls the tone movement of a note." DECAY "This knob controls the time a note takes to fade." ACCENT "This knob controls the accent of the Bass Pattern." "The TB-303 has two waveforms" · Notes on slide: "To slide from one note to another, write the slide on the first of the two notes." "When writing a slide, if there is a rest between the two notes, the slide effect does not work." "If you write a slide between two notes of the same pitch, the result is a 'TIED' note."
- [Vermona PERfourMER MKII owner's manual](https://archive.org/details/manualzilla-id-7445238): filter "low-pass-filter with a slope of 24dB per octave. This proven effective filter-type has already been used in legendary synthesizer-models developed by Bob Moog" (p. 12); RESONANCE "a feedback circuit within the filter that emphasizes the cut-off frequency. Higher values can color the sound significantly, which is regularly used for resonant bass sounds in Acid-House and Techno. With values higher than 3 o clock, the filter will start to self-oscillate" (p. 13); GLIDE "With AUTO GLIDE enabled, the glide-effect will only be active with notes played legato" (p. 8); "The modulation intensity of the envelope generator can be controlled by MIDI-velocity" (VCA, p. 14); edit parameters 4 VELOCITY "modulation of the VCA's envelope amount through incoming velocity data", 5 AUTO GLIDE "a glide (portamento) will only be performed with two adjacent notes being played overlapping", 6 LEGATO "the envelope will not be retriggered with adjacent notes played overlapping" (pp. 29–30).
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): velocity can be global or per step (1 to 127); hold a step and turn knob 1 (p. 54); "a note can be set to LEG - Legato to create a seamless pitch glide between sequential notes", gate per step with knob 3 (p. 55).
- [Elektron Digitone II user manual](https://www.elektron.se/wp-content/uploads/2026/10/Digitone-2-User-Manual_ENG_OS1.12_261008.pdf), [Electro-Harmonix Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf) and [Strymon NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf) for the rig basics.
