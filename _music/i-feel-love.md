---
kind: breakdown
shelf: I Feel Love
title: I Feel Love
artist: Donna Summer
year: 1977
listen: https://www.youtube.com/watch?v=yEbaeLv-aOo
summary: A disco record where every sound except one drum came from a Moog modular locked to the tape. The idea we take from it is the first one Moroder had: write the sequenced bassline before the song, and move it with one key.
order: 1
---

## Listen first

Play it on [Donna Summer's official YouTube channel](https://www.youtube.com/watch?v=yEbaeLv-aOo) (the single edit) or the album version on [Apple Music](https://music.apple.com/us/album/i-feel-love/1442959303?i=1442959426).

- Listen to the bass first. Moroder wrote it before anything else.
- Listen for the moments the whole pulse moves to a new note. Moroder describes pressing a key to move the sequence.
- Listen to the drums: the producers remember them differently (see below), so trust your ears on what is a real drum.
- On headphones, ask whether the bass is the same in both ears. That is the one question no source settles for us.

## The structure

No source gives timings for the sections, so there is no timeline here. What the sources do say about the shape:

- It was the album's last song. Bellotte planned *I Remember Yesterday* as a run through popular music "up until the present and on into the future", and "the final, futuristic song was 'I Feel Love'".
- It was recorded in short bursts: Moroder would "go back maybe eight bars, start it, see if it was syncing up", then record "another eight bars or ten bars" and retune.
- The single is shorter than the album take: Casablanca's Neil Bogart called and said it "needs three edits and these are the edits". Those edits were cut from the tape and thrown away.

## What the artist used

```gear
Moog modular (Robbie Wedel's) :: The whole song "had to be done with the Moog", locked to the tape :: https://www.soundonsound.com/techniques/classic-tracks-donna-summer-feel-love
Reference pulse on tape track 16 :: Wedel's sync trick: everything played later locks to the first take :: https://www.soundonsound.com/techniques/classic-tracks-donna-summer-feel-love
Bass drum played by Keith Forsey :: Moroder: the only sound not from the Moog :: https://www.vice.com/en/article/how-we-made-giorgio-moroder-on-i-feel-love
Studer A80 16-track and a Harrison 32/32 desk, Musicland, Munich :: The recording chain :: https://www.soundonsound.com/techniques/classic-tracks-donna-summer-feel-love
"One of the early Lexicons" and compression :: Bellotte: the only effects on the track :: https://www.soundonsound.com/techniques/classic-tracks-donna-summer-feel-love
Neumann U87 :: Vocals :: https://www.soundonsound.com/techniques/classic-tracks-donna-summer-feel-love
```

## How each part is made

### The bassline came first

Moroder's own words: "I didn't want to start to compose a song traditionally on a piano and then say, okay, now I do the tracks. I thought, I do the tracks before. And I started with the bass line." The sequence played a fixed pattern, and a key moved it: "if you push a C, you'd would hear 'dum-dum-dum-dum,' then if you push a D you would get (higher pitch) 'dum-dum-dum-dum.'" C and D are his example in the interview, not a transcription of the song.

**Why it holds together:** Bellotte explains the sync. Wedel recorded "a reference pulse on track 16 of the tape, and from that we can then lock in the Moog so that the rest of the tracks are perfectly synchronised", so "every other synthesized sound locked in absolutely solidly with the original tempo." That is the artists' account of the mechanism, not a theory of ours.

**Tempo:** MusicRadar's tutorial measures "126.5 BPM". No producer states a tempo in the sources we fetched, so treat it as MusicRadar's figure.

### The doubled pulse: not settled

Two secondary sources say a delay doubles every bass note: MusicRadar ("Moroder's engineer accidentally added delay to the bass part") and Wikipedia ("Each note of the bassline is doubled by a delay effect. The unmodified bassline plays through the left channel and the delayed repetition through the right"). But Bellotte, who co-produced it, told Sound On Sound: "In terms of effects on this track, there was only compression and reverb from one of the early Lexicons". The sources contradict each other, so we don't state it as fact. **For your ears:** on headphones, are the in-between notes only on the right? If yes, the delay story fits what you hear.

### The drums: two memories

Moroder: "The drums was all except the bass drum. Because the Moog couldn't give me a punch sound", and the kick was Keith Forsey, who took "maybe five or six takes". Bellotte: "Robbie simulated a hi-hat, snare and bass drum on there, as well as a swell pad". Both agree the hi-hat and snare came from the Moog. Whether the kick is a real drum is for your ears. The drum pattern is not documented, so there is no step grid here.

## Rebuild it on my rig

**This is our rebuild, not the original.** Moroder had a room-sized Moog modular; we have one PERfourMER channel. Every control below does what its manual says; the knob positions are our starting points to tune by ear.

We play the bass on **synth channel 1**, not the usual bass channel 2, so it goes through the Grand Canyon (channel 2 skips the pedals).

## 1. PERfourMER: the hammer bass

```settings
WAVE :: [sine|triangle|square|*saw*|noise|EXT] :: Our choice: the brightest wave, so the filter has something to shape. The original Moog patch isn't documented.
OCTAVE :: 16' :: Low, like a bass.
CUTOFF :: 11 o'clock :: Half open. Lower cutoff = more muffled (manual p. 12).
RESONANCE :: 9 o'clock :: A little. Above 3 o'clock the filter self-oscillates (manual p. 13).
Filter EG INT :: 2 o'clock :: Each note opens the filter and closes again: a punch per note (manual p. 13).
VCA MODE :: [*EG*|GATE|ON] :: The envelope shapes each note.
ATTACK :: min :: Instant.
DECAY :: 10 o'clock :: Short. If a note is shorter than the decay, the decay is cut off (manual p. 20).
SUSTAIN :: min :: Nothing held: every note is a hit.
RELEASE :: 8 o'clock :: Very short, so fast notes don't smear.
GLIDE :: min :: No slides: Moroder's pulse is steady.
PAN :: noon :: Into the main output that feeds the pedals.
```

## 2. OXI One: write the bass first, then move it

1. Tempo: hold **Shift**, turn **knob 1**. Try **126** (MusicRadar's figure is 126.5).
2. Sequencer 1, Mono, Ch 1: fill a bar with short repeated notes on one pitch. The exact pattern is not documented; build the one you hear.
3. Do what Moroder describes: copy the bar and move the copy up a whole step (his "C, then D" example). Now the whole pulse changes note while the rhythm stays.
4. Shorten the notes if they smear: hold a step and turn **knob 3** (Gate) (OXI manual p. 55).

## 3. Grand Canyon: only if your ears hear the delay

Skip this section if, on headphones, the original bass sounds the same in both ears. If you hear the extra notes on one side, try this (it is the MusicRadar/Wikipedia version, not a confirmed one):

```settings
DELAY TYPE :: ECHO :: Plain 24-bit digital delay (manual p. 16).
TAP DIV :: sixteenth note :: The delay lands one sixteenth after each note. TAP DIV assumes you tapped a quarter note (manual p. 12).
FEEDBACK :: min :: One repeat, not a trail.
DELAY LVL :: 2 o'clock :: Past 2 o'clock the dry signal starts to drop (manual p. 8); here you keep both.
PING PONG :: [*off*|on] :: With PING PONG on, repeats bounce left and right (manual p. 11), which is not one fixed side. Leave it off and pan in your mixer instead.
```

Tap the tempo on the **TAP/LOOP** footswitch, then press **TAP DIV** until the sixteenth-note LED is lit.

## 4. NightSky

Keep it at neutral (rig page) with **REVERB** low. Bellotte says the only effects were compression and "reverb from one of the early Lexicons"; which reverb settings, the sources don't say.

## What needs your ears

- Is each bass note doubled by a delay, and on which side? (Sources disagree.)
- Is the kick a real drum (Moroder) or the Moog (Bellotte)?
- The bass rhythm and the notes it moves through: not documented, so play along and write them down.

## Sources

- Richard Buskin, ["Classic Tracks: Donna Summer 'I Feel Love'"](https://www.soundonsound.com/techniques/classic-tracks-donna-summer-feel-love), *Sound On Sound*, October 2009. Bellotte: "He came in with four cases containing the Moog and set it all up. Giorgio had the idea for how the bass should go, and we explained the concept to Robbie that the whole song had to be done with the Moog." · "first, we need to record a reference pulse on track 16 of the tape, and from that we can then lock in the Moog so that the rest of the tracks are perfectly synchronised." · "every other synthesized sound locked in absolutely solidly with the original tempo." · "Robbie simulated a hi-hat, snare and bass drum on there, as well as a swell pad" · "It was recorded on a 16-track Studer A80 in an Eastlake room at Musicland, where we had a 32/32 Harrison desk. In terms of effects on this track, there was only compression and reverb from one of the early Lexicons, while for vocals we just used Neumann U87s." · "the final, futuristic song was 'I Feel Love'." · "'The single is 'I Feel Love', it needs three edits and these are the edits.'"
- ["How We Made: Giorgio Moroder on 'I Feel Love'"](https://www.vice.com/en/article/how-we-made-giorgio-moroder-on-i-feel-love), *Noisey/Vice*. Moroder: "The drums was all except the bass drum. Because the Moog couldn't give me a punch sound" · "that was Keith Forsey" · "I thought, I do the tracks before. And I started with the bass line" · "if you push a C, you'd would hear 'dum-dum-dum-dum,' then if you push a D you would get (higher pitch) 'dum-dum-dum-dum.'" · "So I would go back maybe eight bars, start it, see if it was syncing up. And then at one point, record another eight bars or ten bars".
- ["How to replicate the trailblazing pulse of I Feel Love"](https://www.musicradar.com/artists/one-day-in-berlin-eno-came-running-in-and-said-i-have-heard-the-sound-of-the-future-how-to-replicate-the-trailblazing-pulse-of-i-feel-love), *MusicRadar*: "It was something of a happy accident when Moroder's engineer accidentally added delay to the bass part" · "The original track clocks at 126.5 BPM". (Secondary; contradicted on the delay by Bellotte above.)
- [Wikipedia, "I Feel Love"](https://en.wikipedia.org/wiki/I_Feel_Love): "Each note of the bassline is doubled by a delay effect. The unmodified bassline plays through the left channel and the delayed repetition through the right". (Secondary.)
- [Vermona PERfourMER MKII owner's manual](https://archive.org/details/manualzilla-id-7445238): CUTOFF "Setting the cutoff lower will result in a more muffled sound" (p. 12); RESONANCE "With values higher than 3 o clock, the filter will start to self-oscillate" (p. 13); DECAY "In case the MIDI-note is shorter than the decay-time, this phase will be aborted" (p. 20).
- [Electro-Harmonix Grand Canyon manual](https://www.ehx.com/wp-content/uploads/2021/01/grand-canyon-manual.pdf): DELAY LVL "As the knob is turned past 2 o'clock, the dry signal decreases in volume" (p. 8); PING PONG "bounces each delay repeat back and forth between the left and right outputs" (p. 11); TAP DIV "assumes that what is tapped is a quarter note" (p. 12); ECHO "Accurate 24-bit digital delay" (p. 16).
- [Strymon NightSky manual](https://www.strymon.net/manuals/Nightsky_UserManual_RevF.pdf) for the neutral settings.
- [OXI One MKII manual](https://www.manualslib.com/manual/4203168/Ox-One-Mk-Ii.html): Gate per step, "between 2-99" (p. 55).
