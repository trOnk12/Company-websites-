---
kind: breakdown
shelf: No UFOs
title: No UFOs
artist: Model 500 (Juan Atkins)
year: 1985
listen: https://music.apple.com/us/album/no-ufos-vocal/1539427278?i=1539427286
summary: Often called the first techno record, made in a basement on an eight-track. The idea we take from it is the setup: a step sequencer playing the bass, two drum machines chained by MIDI, and a frozen piece of voice.
order: 3
---

## Listen first

Play the original vocal and instrumental versions on Apple Music: [No Ufo's (Original Version) EP](https://music.apple.com/us/album/no-ufos-vocal/1539427278?i=1539427286) (Model 500's own releases).

- Listen to the bass: a step sequencer (Roland MSQ-700) plays it on a Six-Trak, so it never varies its timing.
- Listen to the drums: two machines, a TR-909 and a DrumTraks, running together over MIDI.
- Listen for the stabs and drones: a Pro-One through a reverb.
- Listen to the voice: parts of it are caught and held by a delay, Atkins' "freeze" effects.

## The structure

No source gives section timings, so there is no timeline here, and none of our sources describes the arrangement. Listen and note it yourself: when the voice enters, when it freezes, when the drums drop.

## What the artist used

```gear
Roland MSQ-700 :: The MIDI sequencer that played the bass :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
Sequential Six-Trak :: The bass sound, triggered by the MSQ-700 :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
Roland TR-909 and Sequential Circuits DrumTraks :: The beats, chained over MIDI :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
Sequential Circuits Pro-One :: Stab and drone effects :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
Lexicon PCM-60 :: Reverb on the Pro-One :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
Sennheiser MD 421, then a Lexicon delay :: The vocal, and its "freeze" effects :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
Tascam eight-track and 16-channel board, mixed to a Tascam 22-2 :: Metroplex Soundworks, his grandmother's basement :: https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos
```

## How each part is made

### Two drum machines, one clock

Atkins chained a TR-909 and a DrumTraks over MIDI: "When I'd MIDI out of the DrumTraks and MIDI into the 909, it was a perfect sync". With a catch: "if I started the DrumTraks, the 909 didn't start automatically. You'd have to make it start. And sometimes whether [the patterns] played in sync or not depended on where you started." The drum patterns are not documented, so there is no step grid here.

### The bass: a sequencer, not a player

"Atkins meanwhile used the MSQ-700 to trigger the Six-Trak for the 'No UFOs' bass line". Sound On Sound's writer calls it a "squelchy synth bass line"; the notes and the Six-Trak patch are not documented.

### Stabs, drones and a frozen voice

He "added stab and drone effects played on his Pro-One, fed through his Lexicon PCM-60 digital reverb unit", then the vocal, "before capturing parts of it for distinctive 'freeze' effects using a Lexicon delay." Which Lexicon delay and how it was set: not documented.

### The intent

Atkins on why it hit: "I had been doing Cybotron since 1980. So, I sort of had a five-year head start in terms of knowing what the public liked ... it was sort of a no brainer. The experimental phase was somewhat over with by that time." On the Detroit-factory theory: "I wasn't looking at the skyline, saying, 'OK, this music fits'", only "a product of your surroundings on a subconscious level."

## Rebuild it on my rig

**This is our rebuild, not the original.** The OXI plays the MSQ-700's role, the PERfourMER the Six-Trak's and the Pro-One's, the Digitone II the drum machines', and the NightSky's INFINITE stands in for the Lexicon "freeze" (a reverb hold, not a delay capture: a different device doing a similar job). Every control does what its manual says; the positions are our starting points.

**Wiring the Digitone II in (once):** PERfourMER **MIDI THRU** → Digitone II **MIDI IN** (PERfourMER manual p. 23). On the Digitone, **SETTINGS › MIDI CONFIG › SYNC**: **CLOCK RECEIVE** and **TRANSPORT RECEIVE** on (manual p. 74). That avoids Atkins' problem of one machine not starting: both follow the OXI's start.

## 1. Digitone II: the drums

1. On two tracks pick **FM DRUM**: **[FUNC] + [SYN]**, choose it, **[YES]** (manual p. 89). One kick, one hat (body **LEV** down, noise **NLEV** up, short **NDEC**, pp. 95–96).
2. Program by ear with **[RECORD]** and the **[TRIG]** keys (p. 43). The record's patterns are not documented.

## 2. PERfourMER: the sequenced bass (channel 2)

```settings
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Our choice; the Six-Trak patch isn't documented.
OCTAVE :: 16' :: Low.
CUTOFF :: 10 o'clock :: Fairly closed.
RESONANCE :: 1 o'clock :: The PERfourMER manual: higher resonance is "regularly used for resonant bass sounds in Acid-House and Techno" (p. 13). Stay below 3 o'clock, where it self-oscillates.
Filter EG INT :: 2 o'clock :: Each note opens the filter: the "squelch" SOS hears.
DECAY :: 10 o'clock :: Short.
SUSTAIN :: min :: Each note is a hit.
PAN :: max :: Dry, outside the pedals (rig page).
```

On the OXI, sequencer 2 (Mono, Ch 2): write the bass by ear. Let it loop unchanged, like the MSQ-700.

## 3. PERfourMER: the Pro-One drone (channel 1)

```settings
WAVE :: [sine|triangle|*square*|saw|noise|EXT] :: Our choice; the Pro-One patch isn't documented.
OCTAVE :: 8' :: Middle.
CUTOFF :: noon :: Half open.
VCA MODE :: [*EG*|GATE|ON] :: Envelope.
ATTACK :: min :: For a stab. For a drone, turn it up and hold the note.
DECAY :: 11 o'clock :: A short stab.
SUSTAIN :: min :: Stab. Turn SUSTAIN up for a drone.
PAN :: noon :: Into the pedals.
```

## 4. NightSky: the reverb, and the freeze

```settings
TEXTURE :: [sparse|*dense*|diffuse] :: "Plate-like reverb with a fast response" (manual p. 6); the PCM-60's setting isn't documented.
REVERB :: 11 o'clock :: Enough to hear the stabs ring.
DRY :: noon :: Unity.
```

To freeze: let a stab or drone ring, then press **INFINITE**. The manual: it "Holds the input to the reverb core while also allowing new audio to be processed by the reverb on top of the 'frozen' audio" (p. 18). Press again to release. If you want nothing new added while frozen, turn **Infinite Input** off: hold **TARGET** and turn **REVERB** (p. 18).

## What needs your ears

- The drum patterns, the bass notes and the arrangement: none are documented in our sources.
- Which parts of the voice are frozen, and for how long.

## Sources

- Tom Doyle, ["Classic Tracks: Model 500 'No UFOs'"](https://www.soundonsound.com/techniques/classic-tracks-model-500-no-ufos), *Sound On Sound*, November 2024, with Juan Atkins: "For the track's beats, using MIDI, Atkins chained together a Roland TR‑909 and Sequential Circuits DrumTraks. 'When I'd MIDI out of the DrumTraks and MIDI into the 909, it was a perfect sync,' he says. 'The only thing about MIDI in the early days was that... like if I started the DrumTraks, the 909 didn't start automatically. You'd have to make it start. And sometimes whether [the patterns] played in sync or not depended on where you started.'" · "Atkins meanwhile used the MSQ‑700 to trigger the Six‑Trak for the 'No UFOs' bass line and added stab and drone effects played on his Pro‑One, fed through his Lexicon PCM‑60 digital reverb unit. He then added his part‑spoken, part‑sung vocal, recorded using a Sennheiser MD 421, before capturing parts of it for distinctive 'freeze' effects using a Lexicon delay. In the final stage, he mixed the track down to a Tascam 22‑2 two‑track" · "he built his own studio, Metroplex Soundworks, in the basement of his grandmother's house, equipped with a Tascam eight‑track tape machine and 16‑channel board" · "Released in April 1985 on his Metroplex label" · "'No UFOs' was a total home recording." · "So, I sort of had a five‑year head start in terms of knowing what the public liked" · "I wasn't looking at the skyline, saying, 'OK, this music fits', y'know. But I believe, definitely, it's just sort of a product of your surroundings on a subconscious level."
- [Vermona PERfourMER MKII owner's manual](https://archive.org/details/manualzilla-id-7445238): RESONANCE "Higher values can color the sound significantly, which is regularly used for resonant bass sounds in Acid-House and Techno. With values higher than 3 o clock, the filter will start to self-oscillate" (p. 13); MIDI THRU (p. 23).
- [Strymon NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf): TEXTURE "dense: Plate-like reverb with a fast response and dense reflections" (p. 6); INFINITE "Holds the input to the reverb core while also allowing new audio to be processed by the reverb on top of the 'frozen' audio." and "Configuring Infinite Input: Press and hold the TARGET button and turn the REVERB knob." (p. 18).
- [Elektron Digitone II user manual](https://www.elektron.se/wp-content/uploads/2026/10/Digitone-2-User-Manual_ENG_OS1.12_261008.pdf): machine menu (p. 89), FM DRUM (pp. 93–96), GRID RECORDING (p. 43), SYNC (p. 74).
- [Electro-Harmonix Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf) and [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html) for the rig basics.
