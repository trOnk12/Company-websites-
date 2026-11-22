---
kind: breakdown
shelf: Planet Rock
title: Planet Rock
artist: Afrika Bambaataa & the Soulsonic Force
year: 1982
listen: https://www.youtube.com/watch?v=_rlUQsC8ECk
summary: Electro was born from one rented TR-808, two synths played by hand and a Fairlight's factory sounds. The idea we take from it is Arthur Baker's: the bass plays exactly with the kick, and the snare is gone, leaving kick and handclaps.
order: 2
---

## Listen first

Play it on [Tommy Boy's official YouTube channel](https://www.youtube.com/watch?v=_rlUQsC8ECk).

- Listen to the low end: Baker had the bass played with the kick "all the way through the record".
- Listen for what isn't there: a snare. Baker took it out, leaving kick and handclaps.
- Listen for the orchestra hit and the explosion: both are factory sounds from a Fairlight that happened to be in the studio.
- Listen to the electronic voice: a very short delay with feedback, not a vocoder box.

## The structure

No source gives section timings, so there is no timeline here. What the people who made it say:

- **The beat:** Kraftwerk's "Numbers", re-recorded on an 808, because "the beat on 'Trans-Europe Express' was too slow". Bambaataa also asked for the break from Captain Sky's "Super Sperm".
- **The melody:** borrowed from Kraftwerk's "Trans-Europe Express" (Kraftwerk were later paid per record).
- **The break:** the Fairlight's explosion sound "which we used in the break".
- **The chorus:** Baker wrote "Rock rock to the Planet Rock, don't stop", and engineer Jay Burnett is the voice saying it.
- **The rap:** the rappers worked out a half-time delivery, "MC Popping", because "The beat was so fast, it would have been difficult for them to rap right on the beat".

## What the artist used

```gear
Roland TR-808 (rented, with its owner Joe) :: All the drums :: https://www.soundonsound.com/techniques/classic-tracks-afrika-bambaataa-soulsonic-force-planet-rock
Moog Micromoog (John Robie) :: The bass and the effects, played by hand :: https://www.musicradar.com/news/tech/future-music-interview-with-arthur-baker-from-2006-566555
Sequential Prophet-5 (John Robie) :: The strings :: https://www.musicradar.com/news/tech/future-music-interview-with-arthur-baker-from-2006-566555
Fairlight (the studio's) :: Factory sounds only: the orchestra hit, the explosion and the handclaps :: https://www.soundonsound.com/techniques/classic-tracks-afrika-bambaataa-soulsonic-force-planet-rock
Lexicon PCM41 digital delay :: The electronic voice: tight feedback on a very short delay :: https://www.musicradar.com/news/tech/future-music-interview-with-arthur-baker-from-2006-566555
Sony reverb, Neve desk, Studer 24-track (Intergalactic studio) :: Reverb and recording :: https://www.soundonsound.com/techniques/classic-tracks-afrika-bambaataa-soulsonic-force-planet-rock
```

## How each part is made

### The drums: an 808 copying Kraftwerk

Baker: "We played him 'Numbers' and asked him to copy the beat, and then Bambaataa asked him to copy the beat from 'Super Sperm'". Why an 808: "since we were basically trying to emulate the Kraftwerk sound, when we went into the studio we decided we needed a drum machine. What's more, after hearing an 808, we knew that was what we wanted". The programmed pattern itself is not written down anywhere we found, so there is no step grid here.

The missing snare was a mixing decision: "the idea of removing the snare and just having the kick and the handclaps. No one had done that ... that just came about when I was mixing."

### The bass, locked to the kick

Nothing was sequenced: "John played everything by hand, nothing was sequenced on 'Planet Rock' — we didn't have a sequencer at that time." So how did a hand-played bass stay tight? "I had Robie play the bass with the kick all the way through the record, and since we couldn't program it we slowed the tape down so that it would be really tight." Baker doesn't say more about how the slowed tape helped; the documented result is a bass that hits with every kick.

### The orchestra hit

A happy accident: "You couldn't sample on the Fairlight, it was all pre-sampled sounds, so we used an explosion, the handclaps and the orchestra. Once we heard the orchestra ... we thought, 'Oh, that's amazing. We've got to use that.'"

### The electronic voice

Baker: "The electronic voice was done with a tight feedback on a really tight delay through a Lexicon PCM41". **Why it works (acoustics):** a delay fed back into itself is a *feedback comb filter*. It rings at the frequency whose period equals the delay time, and its multiples: Julius O. Smith's textbook gives the resonant peaks at ω = 2πk/M for a delay of M samples. A 5 ms delay rings at 200 Hz, 400 Hz, 600 Hz… so any voice through it takes on a fixed, metallic pitch. That is textbook physics; Baker doesn't explain it, he describes what he did.

### The intent

Baker: "I wanted to make something that was going to be 'uptown' and 'downtown.' From day one that was the idea." And: "We wanted to make a record that people into Talking Heads would play, and that people into Sugarhill Gang would play."

## Rebuild it on my rig

**This is our rebuild, not the original.** No 808 and no Fairlight here: drums come from the Digitone II's FM DRUM machine, the bass and strings from the PERfourMER, the voice effect from the Grand Canyon. Every control does what its manual says; the positions are our starting points.

**Wiring the Digitone II in (once):** PERfourMER **MIDI THRU** → Digitone II **MIDI IN** (THRU passes on everything the OXI sends, PERfourMER manual p. 23). On the Digitone, in **SETTINGS › MIDI CONFIG › SYNC**, turn **CLOCK RECEIVE** and **TRANSPORT RECEIVE** on (Digitone manual p. 74). Its audio goes to your mixer, dry.

## 1. Digitone II: kick and handclaps, no snare

1. Pick a track for the kick: press **[FUNC] + [SYN]**, choose **FM DRUM**, press **[YES]** (manual p. 89). Do the same on a second track for the handclap.
2. Kick: start with a short **DEC** on page 3 (body decay) and some **SDEP** (sweep depth) on page 1 so the pitch drops (manual pp. 94–95). Tune by ear against the record.
3. Clap: turn the body (**LEV**, page 3) down and the noise (**NLEV**, page 4) up; a short **NDEC** (manual pp. 95–96).
4. Press **[RECORD]** for grid recording and place trigs with the **[TRIG]** keys (manual p. 43). The record's pattern isn't documented: copy what you hear, and **don't add a snare** — that's Baker's idea.

## 2. PERfourMER: the bass on the kick's steps

Use the rig's bass patch on **channel 2**, with a shorter note:

```settings
DECAY :: 10 o'clock :: Short, so each bass note ends before the next kick.
SUSTAIN :: min :: A hit, like the kick it doubles.
GLIDE :: min :: No slides: the bass jumps from note to note.
```

On the OXI, sequencer 2: put a bass note on **exactly the steps** where you put the Digitone kick. That's Baker's rule ("play the bass with the kick all the way through the record"); the notes themselves are not documented.

## 3. PERfourMER: the strings

Channels **1, 3 and 4** on MIDI channel 1, PLAYMODE **P1** (three-voice chords, manual p. 27). Set all three the same:

```settings
PLAYMODE :: [M1|M2|*P1*|P2|D1|D2] :: Poly: each note of a chord gets its own channel.
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Our choice for strings; the Prophet-5 patch isn't documented.
OCTAVE :: 8' :: Middle register.
CUTOFF :: 1 o'clock :: Brighter than a pad.
ATTACK :: 11 o'clock :: A short swell.
SUSTAIN :: 3 o'clock :: Holds while the chord is held.
RELEASE :: 11 o'clock :: A short fade.
```

## 4. Grand Canyon: the electronic voice

Feed a voice in: plug a line-level voice (from your interface) into channel 1's **EXT IN** and set channel 1's **WAVE** to **EXT** (manual pp. 7, 21), **VCA MODE** to **ON** so it passes all the time (p. 14). It reaches the pedals through the main output. (For this section, use channel 1 for the voice instead of the strings.)

```settings
DELAY TYPE :: ECHO :: Plain digital delay (manual p. 16).
DELAY :: min :: About 5 ms, the shortest: most delay types range "from 5 milliseconds to 3 seconds" (manual p. 8). 5 ms rings at 200 Hz and its multiples.
FEEDBACK :: 3 o'clock :: High: the more the delay feeds itself, the stronger the ring. Back off if it starts to howl.
DELAY LVL :: 2 o'clock :: Dry and wet both at full (manual p. 8).
PING PONG :: [*off*|on] :: Each repeat to both outputs.
```

Turn **DELAY** slowly up from minimum: the voice's metallic pitch drops as the delay gets longer (a longer delay = a lower ringing frequency).

## 5. NightSky

Neutral (rig page), **REVERB** low: Baker names a "Sony reverb" but not how it was set.

## What needs your ears

- The 808 pattern and the handclap placement: copied from Kraftwerk's "Numbers" and "Super Sperm", never written down in our sources.
- The bass notes and the string melody (we don't transcribe the borrowed Kraftwerk melody).
- How much delay feedback the record's voice has.

## Sources

- Richard Buskin, ["Classic Tracks: Afrika Bambaataa & The Soulsonic Force 'Planet Rock'"](https://www.soundonsound.com/techniques/classic-tracks-afrika-bambaataa-soulsonic-force-planet-rock), *Sound On Sound*, November 2008. Baker: "So I looked in the Village Voice and saw an ad stating, 'Man with drum machine, $30 a session.' His name was Joe and he had an 808" · "We played him 'Numbers' and asked him to copy the beat, and then Bambaataa asked him to copy the beat from 'Super Sperm'" · "John played everything by hand, nothing was sequenced on 'Planet Rock' — we didn't have a sequencer at that time." · "I had Robie play the bass with the kick all the way through the record, and since we couldn't program it we slowed the tape down so that it would be really tight. Then there was the idea of removing the snare and just having the kick and the handclaps." · "You couldn't sample on the Fairlight, it was all pre-sampled sounds, so we used an explosion, the handclaps and the orchestra." · "the beat on 'Trans–Europe Express' was too slow" · "The beat was so fast, it would have been difficult for them to rap right on the beat, so he created a new style which he called 'MC Popping'." · "[Intergalactic] housed a classic Neve console, Studer 24–track tape machine and Urei monitors, in addition to a Lexicon PCM41 digital delay, Sony reverb and the aforementioned Fairlight". (The RBMA lecture below gives the ad as "20 dollars a session": the two accounts differ on the price.)
- ["Future Music interview with Arthur Baker from 2006"](https://www.musicradar.com/news/tech/future-music-interview-with-arthur-baker-from-2006-566555), *MusicRadar*: "Planet Rock was effectively made with one drum-machine, one synth and one delay." · "I think we ended up using a Micromoog for all the effects and the bass sound. We used a Prophet 5 for the strings and a Roland TR-808 for the drums. There was a Fairlight system that just happened to be in the studio, so we used it for the orchestral stabs and explosions. The electronic voice was done with a tight feedback on a really tight delay through a Lexicon PCM41".
- ["Key Tracks: Arthur Baker on 'Planet Rock'"](https://daily.redbullmusicacademy.com/2013/04/key-tracks-arthur-baker-on-planet-rock), *Red Bull Music Academy*, from his 2007 lecture: "We were trying to emulate the sound of Kraftwerk, the electronic drum sound." · "it had a few sounds in it, one being this sort of explosion sound, which we used in the break, and the orchestra" · "When we went in the studio I wanted to make something that was going to be 'uptown' and 'downtown.' From day one that was the idea." · "We wanted to make a record that people into Talking Heads would play, and that people into Sugarhill Gang would play."
- Julius O. Smith III, ["Feedback Comb Filter Amplitude Response"](https://ccrma.stanford.edu/~jos/pasp/Feedback_Comb_Filter_Amplitude.html), *Physical Audio Signal Processing*, CCRMA: "Note that g>0 produces resonant peaks at ω_k = 2π k/M". And ["Feedback Comb Filters"](https://ccrma.stanford.edu/~jos/pasp/Feedback_Comb_Filters.html): the feedback comb filter "can be regarded as a computational physical model of a series of echoes, exponentially decaying and uniformly spaced in time."
- [Vermona PERfourMER MKII owner's manual](https://archive.org/details/manualzilla-id-7445238): EXT IN "allows feeding an external audio-signal into the synthesizer-channel. This signal can be selected using the WAVE-selector switch" (p. 21); VCA MODE ON "the VCA is permanently on" (p. 14); MIDI THRU "The MIDI-signal arriving at the MIDI-input will be passed through to the MIDI THRU output" (p. 23); POLY 1 (p. 27).
- [Elektron Digitone II user manual](https://www.elektron.se/wp-content/uploads/2026/10/Digitone-2-User-Manual_ENG_OS1.12_261008.pdf): "Press [FUNC] + [SYN] to open the MACHINE menu" (A.1, p. 89); FM DRUM "an FM engine specially tailored to produce drums and other percussive sounds" (p. 93), SDEP, DEC, LEV, NDEC, NLEV (pp. 94–96); GRID RECORDING (p. 43); "CLOCK RECEIVE sets whether or not Digitone II responds to MIDI clock sent from external devices" (13.4.1 SYNC, p. 74).
- [Electro-Harmonix Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): "Most Delay Types range from 5 milliseconds to 3 seconds" (p. 8); DELAY LVL (p. 8); ECHO (p. 16).
- [Strymon NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf) for the neutral settings.
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html).
