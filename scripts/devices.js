// The rig as sketch models: one data model per device, drawn in the site's pencil style, with every control at its
// real place on the panel (layouts traced from the manufacturers' top-down photos and manuals).
//
// A model is plain data: controls with an id, a kind, a position and, for selectors, their options. render() draws
// the panel and marks the controls a recipe sets: a knob's pointer turned to its value, a switch's lever or LED on
// its option, a key lit. Each set control carries data attributes, so music.js can animate it (knobs turn from noon
// to their value when the drawing scrolls into view). Use the same models for any future tutorial.
//
//   render('pf', { set: { 'c1.cutoff': { f: 0.3 }, 'c1.wave': { opt: 'saw' } }, view: ['ch1'] })
//   resolve('pf', 'Ch 2 CUTOFF', "10 o'clock", { channel: 1 })  →  { id: 'c2.cutoff', state: { f: 0.3 } }

const { pen } = require('./sketch');

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const deg = f => -150 + 300 * f; // 7 o'clock (0) … 5 o'clock (1), as on every knob in the music section

// ───────── Vermona PERfourMER MKII ─────────
// Four identical channel strips (VCO, VCF, EG / LFO, VCA, jacks), a narrow left column, and the global column right.
function perfourmer() {
  const C = [];
  const strip = k => {
    const dy = 213 * k, ch = `c${k + 1}`;
    const y1 = 160 + dy, y2 = 263 + dy;
    C.push(
      { id: `${ch}.wave`, kind: 'rotary', x: 316, y: y1, r: 36, style: 'cream', label: 'WAVE', opts: [['sine', -80, '∿'], ['triangle', -45, '^'], ['square', -10, '⊓'], ['saw', 35, '/|'], ['noise', 75, '≋'], ['EXT', 110, 'EXT']] },
      { id: `${ch}.glide`, kind: 'knob', x: 410, y: y1, r: 26, style: 'cream', label: 'GLIDE' },
      { id: `${ch}.vco_eg`, kind: 'knob', x: 500, y: y1, r: 26, style: 'cream', label: 'EG INT' },
      { id: `${ch}.octave`, kind: 'rotary', x: 316, y: y2, r: 36, style: 'cream', label: 'OCTAVE', opts: [["4'", -70, "4'"], ["8'", -35, "8'"], ["16'", 5, "16'"], ["32'", 45, "32'"], ['HI', 85, 'HI'], ['LO', 120, 'LO']] },
      { id: `${ch}.tune`, kind: 'knob', x: 410, y: y2, r: 28, style: 'brown', label: 'TUNE' },
      { id: `${ch}.vco_lfo`, kind: 'knob', x: 500, y: y2, r: 26, style: 'cream', label: 'LFO INT' },
      { id: `${ch}.cutoff`, kind: 'knob', x: 596, y: y1, r: 36, style: 'cream', label: 'CUTOFF' },
      { id: `${ch}.vcf_eg`, kind: 'knob', x: 690, y: y1, r: 26, style: 'cream', label: 'EG INT' },
      { id: `${ch}.resonance`, kind: 'knob', x: 596, y: y2, r: 28, style: 'cream', label: 'RESONANCE' },
      { id: `${ch}.vcf_lfo`, kind: 'knob', x: 690, y: y2, r: 26, style: 'cream', label: 'LFO INT' },
      { id: `${ch}.track`, kind: 'switch', x: 766, y: y1 - 4, label: 'TRACK', opts: [['100%', '100'], ['50%', '50'], ['0%', '0']] },
      { id: `${ch}.attack`, kind: 'knob', x: 834, y: y1, r: 26, style: 'cream', label: 'ATTACK' },
      { id: `${ch}.decay`, kind: 'knob', x: 920, y: y1, r: 26, style: 'cream', label: 'DECAY' },
      { id: `${ch}.sustain`, kind: 'knob', x: 1008, y: y1, r: 26, style: 'cream', label: 'SUSTAIN' },
      { id: `${ch}.release`, kind: 'knob', x: 1095, y: y1, r: 26, style: 'cream', label: 'RELEASE' },
      { id: `${ch}.lfo_wave`, kind: 'switch', x: 752, y: y2 - 4, label: 'WAVE', opts: [['saw or square', '⊓/|'], ['sine', '∿'], ['S&H', 'S/H']] },
      { id: `${ch}.lfo_speed`, kind: 'knob', x: 834, y: y2, r: 30, style: 'brown', label: k ? 'PHASE/SPEED' : 'SPEED' },
      { id: `${ch}.vca_mode`, kind: 'switch', x: 906, y: y2 - 4, label: 'MODE', opts: [['ON', 'ON'], ['GATE', '⊓'], ['EG', 'EG']] },
      { id: `${ch}.pan`, kind: 'knob', x: 995, y: y2, r: 26, style: 'cream', label: 'PAN' },
      { id: `${ch}.volume`, kind: 'knob', x: 1095, y: y2, r: 32, style: 'brown', label: 'VOLUME' },
      { id: `${ch}.ext_in`, kind: 'jack', x: 1210, y: y1, label: 'EXT IN / VCO OUT' },
      { id: `${ch}.out`, kind: 'jack', x: 1210, y: y2, label: 'OUT / INSERT' },
      { id: `${ch}.trig`, kind: 'button', x: 230, y: y2 + 30, w: 26, h: 20, label: 'TRIG' },
    );
    if (k === 0) C.push({ id: 'c1.triglock', kind: 'switch', x: 228, y: y1 - 10, label: 'TRIG LOCK', opts: [['TRIG LOCK', ''], ['440Hz', '']], horizontal: true });
    else C.push(
      { id: `${ch}.link`, kind: 'switch', x: 214, y: y1 - 22, label: '', opts: [['VCO', 'VCO'], ['OFF', ''], ['LFO', 'LFO']], horizontal: true },
      { id: `${ch}.fm`, kind: 'knob', x: 230, y: y1 + 70, r: 24, style: 'cream', label: `${k} FM ▸ ${k + 1}` },
    );
  };
  for (let k = 0; k < 4; k++) strip(k);
  C.push(
    { id: 'master_tune', kind: 'knob', x: 1340, y: 262, r: 34, style: 'brown', label: 'MASTER TUNE' },
    { id: 'select', kind: 'knob', x: 1340, y: 465, r: 32, style: 'cream', label: 'SELECT / SEQ' },
    { id: 'edit', kind: 'button', x: 1320, y: 586, w: 24, h: 22, label: 'EDIT' },
    { id: 'midi_ch', kind: 'button', x: 1362, y: 586, w: 24, h: 22, label: 'MIDI CH' },
    { id: 'playmode', kind: 'rotary', x: 1340, y: 690, r: 34, style: 'cream', label: 'PLAYMODE', opts: [['M1', -110, 'M1'], ['M2', -62, 'M2'], ['D1', -18, 'D1'], ['D2', 20, 'D2'], ['P1', 60, 'P1'], ['P2', 100, 'P2']] },
    { id: 'master_volume', kind: 'knob', x: 1340, y: 798, r: 34, style: 'brown', label: 'MASTER VOLUME' },
    { id: 'phones', kind: 'jack', x: 1336, y: 900, label: 'HEADPHONES' },
  );
  const decor = [];
  for (let k = 0; k < 4; k++) {
    const dy = 213 * k;
    decor.push({ rect: [165, 107 + dy, 1105, 210] }, { tag: [182, 128 + dy, String(k + 1)] });
    decor.push({ line: [272, 112 + dy, 272, 312 + dy] }, { line: [544, 112 + dy, 544, 312 + dy] }, { line: [790, 112 + dy, 790, 210 + dy] }, { line: [736, 212 + dy, 1150, 212 + dy] }, { line: [736, 212 + dy, 736, 312 + dy] }, { line: [884, 212 + dy, 884, 312 + dy] }, { line: [1150, 112 + dy, 1150, 312 + dy] });
    decor.push({ sec: [408, 113 + dy, 'VCO'] }, { sec: [668, 113 + dy, 'VCF'] }, { sec: [970, 113 + dy, 'EG'] }, { sec: [810, 226 + dy, 'LFO'] }, { sec: [1018, 226 + dy, 'VCA'] });
  }
  decor.push({ title: [172, 92, 'PERfourMER MKII', 'quad analog synthesizer'] });
  const regions = { all: [104, 40, 1490, 960], right: [1278, 120, 130, 840], playmode: [1270, 630, 140, 120], master: [1270, 740, 140, 110] };
  for (let k = 0; k < 4; k++) regions[`ch${k + 1}`] = [160, 96 + 213 * k, 1115, 214];
  return { id: 'pf', name: 'PERfourMER MKII', body: [110, 40, 1480, 955], controls: C, decor, regions, colour: 'pf' };
}

// ───────── Electro-Harmonix Grand Canyon ─────────
function grandCanyon() {
  const TYPES = [['ECHO', 'FILTER', 'BIT CRUSH'], ['MOD', 'MOD RATE', 'MOD DEPTH'], ['MULTI', 'FILTER', 'DECAY/SWELL'], ['REVERSE', 'SENSITIVITY', 'MOD DEPTH'], ['DMM', 'MOD RATE', 'MOD DEPTH'], ['TAPE', 'DISTORTION', 'FLUTTER DEPTH'], ['REVERB', 'VERB TIME', 'VERB TONE'], ['PITCH', 'MODE', 'PITCH'], ['SHIM', 'FILTER', 'MOD DEPTH'], ['SAMPLE/HOLD', 'SENSITIVITY', 'DECAY/SWELL'], ['DRUM', 'RHYTHM', 'DRUM AGE'], ['DOUBLER', 'OFFSET TIME', 'PITCH SPREAD'], ['LOOPER', 'REVERSE', 'SPEED']];
  const C = [
    { id: 'exp_mode', kind: 'button', x: 70, y: 120, w: 34, h: 30, label: 'EXP MODE', round: true },
    { id: 'moment', kind: 'button', x: 140, y: 120, w: 34, h: 30, label: 'MOMENT', round: true },
    { id: 'tails', kind: 'button', x: 206, y: 120, w: 34, h: 30, label: 'TAILS', round: true },
    { id: 'ping_pong', kind: 'button', x: 272, y: 120, w: 34, h: 30, label: 'PING PONG', round: true },
    { id: 'tap_div', kind: 'button', x: 350, y: 110, w: 28, h: 22, label: 'TAP DIV', round: true },
    { id: 'tap_div_leds', kind: 'leds', x: 384, y: 100, opts: [['quarter', '♩'], ['eighth', '♪'], ['triplet', '3'], ['dot', 'DOT']], cols: 2, dx: 26, dy: 22 },
    { id: 'delay_type', kind: 'rotary', x: 492, y: 112, r: 30, style: 'black', label: 'DELAY TYPE', opts: TYPES.map(([t], i) => [t, -140 + i * 23, '']) },
    { id: 'mini_left', kind: 'knob', x: 556, y: 122, r: 15, style: 'black', label: '↓' },
    { id: 'mini_right', kind: 'knob', x: 610, y: 122, r: 15, style: 'black', label: '↓' },
    { id: 'delay_lvl', kind: 'knob', x: 70, y: 232, r: 34, style: 'cream', label: 'DELAY LVL', sub: 'DRY CUT' },
    { id: 'loop_lvl', kind: 'knob', x: 148, y: 232, r: 34, style: 'cream', label: 'LOOP LVL' },
    { id: 'feedback', kind: 'knob', x: 226, y: 232, r: 34, style: 'cream', label: 'FEEDBACK', sub: 'DUB LVL' },
    { id: 'delay', kind: 'knob', x: 304, y: 232, r: 34, style: 'cream', label: 'DELAY', sub: 'FADEOUT' },
    { id: 'mode_btn', kind: 'button', x: 362, y: 232, w: 18, h: 18, label: '', round: true },
    { id: 'mode_leds', kind: 'leds', x: 386, y: 220, opts: [['DELAY', 'DELAY'], ['LOOPER', 'LOOPER']], cols: 1 },
    { id: 'loop_leds', kind: 'leds', x: 70, y: 400, opts: [['MEM', 'MEM'], ['PLAY', 'PLAY'], ['REC', 'REC']], cols: 3, dx: 58 },
    { id: 'tap_loop', kind: 'foot', x: 120, y: 560, label: 'TAP/LOOP' },
    { id: 'bypass', kind: 'foot', x: 560, y: 560, label: 'BYPASS/STOP' },
  ];
  const decor = [
    { jacks: [[60, '9V'], [168, 'R OUT'], [276, 'L OUT'], [384, 'EXP'], [492, 'FSW'], [600, 'INPUT']] },
    { table: { x: 452, y: 172, w: 226, rows: TYPES, id: 'delay_type' } },
    { logo: [330, 470, 'Grand Canyon', 'DELAY & LOOPER'] },
    { rect: [328, 84, 116, 62] },
  ];
  return { id: 'gc', name: 'GRAND CANYON', body: [16, 40, 680, 600], controls: C, decor, regions: { all: [10, 0, 692, 660], top: [10, 70, 692, 316] }, colour: 'gc', types: TYPES };
}

// ───────── Strymon NightSky ─────────
function nightSky() {
  const C = [
    { id: 'speed', kind: 'knob', x: 80, y: 96, r: 32, style: 'black', label: 'SPEED' },
    { id: 'target', kind: 'leds', x: 150, y: 60, opts: [['verb', 'verb'], ['pitch', 'pitch'], ['filter', 'filter']], cols: 1, button: true },
    { id: 'depth', kind: 'knob', x: 266, y: 96, r: 32, style: 'black', label: 'DEPTH' },
    { id: 'shape', kind: 'leds', x: 330, y: 60, opts: [['triangle', '∧∨'], ['square', '⊓⊔'], ['ramp', '/|'], ['saw', '|\\'], ['random', 'rand'], ['env', 'env']], cols: 2, button: true },
    { id: 'length', kind: 'knob', x: 556, y: 96, r: 32, style: 'black', label: 'LENGTH' },
    { id: 'texture', kind: 'leds', x: 620, y: 60, opts: [['sparse', 'sparse'], ['dense', 'dense'], ['diffuse', 'diffuse']], cols: 1, button: true },
    { id: 'size', kind: 'knob', x: 736, y: 96, r: 32, style: 'black', label: 'SIZE/PITCH' },
    { id: 'quantize', kind: 'leds', x: 800, y: 60, opts: [['smooth', 'smooth'], ['half step', 'half step'], ['scale', 'scale']], cols: 1, button: true },
    { id: 'reverb', kind: 'knob', x: 966, y: 96, r: 34, style: 'black', label: 'REVERB' },
    { id: 'low_cut', kind: 'knob', x: 80, y: 262, r: 32, style: 'black', label: 'LOW CUT' },
    { id: 'filter', kind: 'leds', x: 160, y: 236, opts: [['regen', 'regen'], ['low pass', 'low pass']], cols: 1, button: true },
    { id: 'high_cut', kind: 'knob', x: 282, y: 262, r: 32, style: 'black', label: 'HIGH CUT' },
    { id: 'interval', kind: 'knob', x: 440, y: 258, r: 28, style: 'black', label: 'INTERVAL', marks: [['-2nd', -45], ['-4th', -75], ['-5th', -105], ['-8va', -135], ['+2nd', 45], ['+4th', 75], ['+5th', 105], ['+8va', 135]] },
    { id: 'shimmer_btn', kind: 'leds', x: 548, y: 236, opts: [['input', 'input'], ['regen', 'regen']], cols: 1, button: true },
    { id: 'shimmer', kind: 'knob', x: 690, y: 262, r: 32, style: 'black', label: 'SHIMMER' },
    { id: 'glimmer', kind: 'leds', x: 760, y: 236, opts: [['high', 'high'], ['low', 'low']], cols: 1, button: true },
    { id: 'drive', kind: 'leds', x: 852, y: 236, opts: [['pre', 'pre'], ['post', 'post']], cols: 1, button: true },
    { id: 'dry', kind: 'knob', x: 966, y: 262, r: 32, style: 'black', label: 'DRY' },
    { id: 'on', kind: 'foot', x: 120, y: 440, label: 'ON' },
    { id: 'favorite', kind: 'foot', x: 520, y: 440, label: 'FAVORITE' },
    { id: 'infinite', kind: 'foot', x: 900, y: 440, label: 'INFINITE' },
  ];
  const decor = [
    { line: [26, 176, 1020, 176] }, { line: [490, 26, 490, 176] }, { line: [340, 176, 340, 330] }, { line: [912, 26, 912, 330] },
    { sec: [56, 36, 'MOD'] }, { sec: [528, 36, 'DECAY'] }, { sec: [950, 36, 'MIX'] }, { sec: [56, 198, 'TONE'] }, { sec: [378, 198, 'VOICE'] },
    { small: [180, 40, 'TARGET'] }, { small: [360, 40, 'SHAPE'] }, { small: [650, 40, 'TEXTURE'] }, { small: [830, 40, 'QUANTIZE'] }, { small: [185, 218, 'FILTER'] }, { small: [580, 218, 'SHIMMER'] }, { small: [785, 218, 'GLIMMER'] }, { small: [872, 218, 'DRIVE'] },
    { line: [20, 350, 1024, 350] },
    { logo: [520, 520, 'NIGHTSKY', 'time-warped reverberator'] },
  ];
  return { id: 'ns', name: 'NIGHTSKY', body: [16, 16, 1012, 560], controls: C, decor, regions: { all: [8, 8, 1028, 576], panel: [8, 8, 1028, 340] }, colour: 'ns' };
}

// ───────── OXI One MKII ─────────
function oxiOne() {
  const C = [
    { id: 'screen', kind: 'screen', x: 148, y: 362, w: 114, h: 52 },
    ...[103, 162, 232, 297].map((x, i) => ({ id: `enc${i + 1}`, kind: 'knob', x, y: 443, r: 12, style: 'black', label: '' })),
    ...[['back', 478, 'BACK'], ['grid', 513, ''], ['keys', 547, ''], ['hold', 582, ''], ['shift', 621, 'SHIFT']].map(([id, y, l]) => ({ id, kind: 'button', x: 103, y, w: 30, h: 26, label: l, inner: true })),
    ...[['perf', 478, 'PERF'], ['mod', 513, 'MOD'], ['gen', 547, 'GEN'], ['flow', 582, 'FLOW'], ['mute', 621, 'MUTE']].map(([id, y, l]) => ({ id, kind: 'button', x: 297, y, w: 30, h: 26, label: l, inner: true })),
    ...[['load', 160, 478], ['copy', 200, 478], ['undo', 246, 478], ['save', 160, 505], ['paste', 200, 505], ['random', 246, 505], ['init', 160, 533, 'Init'], ['page', 200, 533, '8 Page'], ['lfo', 246, 533, 'LFO'], ['end', 160, 560, 'End'], ['track', 200, 560, 'Track'], ['step', 246, 560, 'Step']].map(([id, x, y, l]) => ({ id, kind: 'button', x, y, w: 32, h: 22, label: l || '', inner: true })),
    { id: 'stop', kind: 'button', x: 160, y: 621, w: 36, h: 26, label: '■', inner: true },
    { id: 'rec', kind: 'button', x: 203, y: 621, w: 36, h: 26, label: '●', inner: true },
    { id: 'play', kind: 'button', x: 246, y: 621, w: 36, h: 26, label: '▶', inner: true },
  ];
  for (let s = 0; s < 8; s++) C.push({ id: `seq${s + 1}`, kind: 'button', x: 350, y: 380 + s * 34.6, w: 20, h: 20, label: String(s + 1), inner: true });
  for (let r = 0; r < 8; r++) for (let c = 0; c < 16; c++) C.push({ id: `pad.${r}.${c}`, kind: 'pad', x: 392 + c * 35.3, y: 380 + r * 34.6 });
  return { id: 'oxi', name: 'OXI ONE MKII', body: [75, 352, 860, 306], controls: C, decor: [{ logo: [102, 380, 'OX', ''] }], regions: { all: [70, 345, 870, 320], left: [70, 345, 300, 320] }, colour: 'oxi' };
}

// ───────── Elektron Digitone II ─────────
function digitone() {
  const C = [
    { id: 'main_volume', kind: 'knob', x: 260, y: 327, r: 16, style: 'cream', label: 'MAIN VOLUME' },
    { id: 'level', kind: 'knob', x: 260, y: 393, r: 16, style: 'cream', label: 'LEVEL/DATA' },
    { id: 'screen', kind: 'screen', x: 298, y: 300, w: 190, h: 110 },
    ...'ABCDEFGH'.split('').map((k, i) => ({ id: `knob_${k}`, kind: 'knob', x: 525 + (i % 4) * 68.3, y: i < 4 ? 328 : 393, r: 16, style: 'cream', label: k })),
    ...['TRIG', 'SYN', 'FLTR', 'AMP', 'FX', 'MOD'].map((k, i) => ({ id: k.toLowerCase(), kind: 'button', x: 523 + i * 41.6, y: 451, w: 30, h: 22, label: k, inner: true })),
    { id: 'func', kind: 'button', x: 266, y: 479, w: 40, h: 26, label: 'FUNC', inner: true },
    ...[['preset', 331], ['settings', 372], ['voice', 413], ['tempo', 455]].map(([id, x]) => ({ id, kind: 'button', x, y: 479, w: 28, h: 26, label: '' })),
    { id: 'keyboard', kind: 'button', x: 266, y: 520, w: 28, h: 26, label: 'KEYBOARD' },
    { id: 'record', kind: 'button', x: 337, y: 520, w: 30, h: 26, label: '○', inner: true },
    { id: 'play', kind: 'button', x: 392, y: 520, w: 30, h: 26, label: '▷', inner: true },
    { id: 'stop', kind: 'button', x: 447, y: 520, w: 30, h: 26, label: '□', inner: true },
    { id: 'yes', kind: 'button', x: 522, y: 500, w: 26, h: 22, label: 'YES', inner: true },
    { id: 'no', kind: 'button', x: 522, y: 541, w: 26, h: 22, label: 'NO', inner: true },
    { id: 'up', kind: 'button', x: 605, y: 500, w: 26, h: 26, label: '∧', inner: true },
    { id: 'left', kind: 'button', x: 564, y: 541, w: 26, h: 26, label: '<', inner: true },
    { id: 'down', kind: 'button', x: 605, y: 541, w: 26, h: 26, label: '∨', inner: true },
    { id: 'right', kind: 'button', x: 647, y: 541, w: 26, h: 26, label: '>', inner: true },
    { id: 'page', kind: 'button', x: 723, y: 541, w: 40, h: 22, label: 'PAGE', inner: true },
    { id: 'trk', kind: 'button', x: 266, y: 568, w: 36, h: 24, label: 'TRK', inner: true },
    { id: 'ptn', kind: 'button', x: 266, y: 612, w: 36, h: 24, label: 'PTN', inner: true },
    { id: 'song', kind: 'button', x: 266, y: 657, w: 36, h: 24, label: 'SONG', inner: true },
    ...Array.from({ length: 16 }, (_, i) => ({ id: `trig${i + 1}`, kind: 'button', x: 330 + (i % 8) * 42.3, y: i < 8 ? 597 : 657, w: 30, h: 40, label: String(i + 1), inner: true })),
    { id: 'arp', kind: 'button', x: 678, y: 597, w: 26, h: 26, label: '♫', inner: true },
    { id: 'note', kind: 'button', x: 678, y: 657, w: 26, h: 26, label: '♩', inner: true },
    { id: 'plus', kind: 'button', x: 731, y: 597, w: 30, h: 30, label: '+', inner: true },
    { id: 'minus', kind: 'button', x: 731, y: 657, w: 30, h: 30, label: '−', inner: true },
  ];
  return { id: 'dn', name: 'DIGITONE II', body: [215, 245, 560, 460], controls: C, decor: [{ text: [393, 424, 'Digitone II'] }, { rect: [312, 573, 330, 108] }], regions: { all: [205, 235, 580, 480] }, colour: 'dn' };
}

const MODELS = { pf: perfourmer(), gc: grandCanyon(), ns: nightSky(), oxi: oxiOne(), dn: digitone() };

// ───────── Drawing ─────────
function drawKnob(p, c, st) {
  const { x, y, r } = c;
  const set = !!st;
  let s = '';
  const fill = { brown: 'kn-brown', black: 'kn-black' }[c.style] || 'kn-cream';
  s += `<path class="${fill}" d="${p.blob(x + 1.5, y + 1.5, r * 0.98, r * 0.98, 0.06)}"/><path class="sk${set ? ' heavy' : ''}" d="${p.ellipse(x, y, r, r)}"/>`;
  if (c.style === 'brown' || r > 30) s += `<path class="sk thin" d="${p.ellipse(x, y, r * 0.72, r * 0.72, false)}"/>`;
  // Scale ticks around the bigger knobs.
  if (r >= 24) { let t = ''; for (let k = 0; k <= 10; k++) { const a = (-150 + 30 * k) * Math.PI / 180; t += p.line(x + Math.sin(a) * (r + 4), y - Math.cos(a) * (r + 4), x + Math.sin(a) * (r + (k % 5 ? 7 : 10)), y - Math.cos(a) * (r + (k % 5 ? 7 : 10)), false) + ' '; } s += `<path class="sk thin" d="${t}"/>`; }
  for (const [m, a] of c.marks || []) { const ar = a * Math.PI / 180; s += `<text class="dv-mark" x="${(x + Math.sin(ar) * (r + 34)).toFixed(1)}" y="${(y - Math.cos(ar) * (r + 14) + 4).toFixed(1)}" text-anchor="middle">${esc(m)}</text>`; }
  const a = st && st.f != null ? deg(st.f) : st && st.a != null ? st.a : 0;
  const ptr = `<path class="sk ptr${set ? ' set' : ''}" d="${p.line(x, y - r * 0.15, x, y - r * 0.9)}"/>${set ? `<circle class="k-dot" cx="${x}" cy="${(y - r * 0.9).toFixed(1)}" r="${Math.max(2.4, r * 0.1).toFixed(1)}"/>` : ''}`;
  s += `<g class="dv-ptr" data-cx="${x}" data-cy="${y}" data-a="${a}" transform="rotate(${a} ${x} ${y})">${ptr}</g>`;
  return s;
}

function drawRotary(p, c, st) {
  // A knob with its options printed around it; the chosen one is circled.
  const opt = st && st.opt != null ? c.opts.find(o => o[0].toLowerCase() === String(st.opt).toLowerCase()) : null;
  let s = drawKnob(p, c, opt ? { a: opt[1] } : st);
  for (const [v, a, l] of c.opts) {
    if (!l) continue;
    const ar = a * Math.PI / 180, lx = c.x + Math.sin(ar) * (c.r + 18), ly = c.y - Math.cos(ar) * (c.r + 18) + 4;
    s += `<text class="dv-mark${opt && opt[0] === v ? ' on' : ''}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="middle">${esc(l)}</text>`;
    if (opt && opt[0] === v) s += `<path class="sk red" d="${p.ellipse(lx, ly - 4, Math.max(10, l.length * 4.4 + 5), 10, false)}"/>`;
  }
  return s;
}

function drawSwitch(p, c, st) {
  const n = c.opts.length, hz = !!c.horizontal;
  const w = hz ? 16 * n + 8 : 18, h = hz ? 18 : 16 * n + 8;
  const x0 = c.x - w / 2, y0 = c.y - h / 2;
  const i = st && st.opt != null ? c.opts.findIndex(o => o[0].toLowerCase() === String(st.opt).toLowerCase()) : -1;
  const at = k => hz ? [x0 + 12 + k * 16, c.y] : [c.x, y0 + 12 + k * 16];
  let s = `<path class="kn-black" d="${p.blob(c.x, c.y, w / 2, h / 2, 0.04)}"/><path class="sk" d="${p.rect(x0, y0, w, h)}"/>`;
  const [lx, ly] = at(i >= 0 ? i : Math.floor(n / 2));
  s += `<g class="dv-lever" data-k="${i}"><path class="kn-cream" d="${p.blob(lx, ly, 6, 6, 0.08)}"/><path class="sk${i >= 0 ? ' red' : ''}" d="${p.ellipse(lx, ly, 6, 6)}"/></g>`;
  c.opts.forEach(([v, l], k) => {
    if (!l) return;
    const [ox, oy] = at(k);
    const tx = hz ? ox : c.x - w / 2 - 6, ty = hz ? c.y - 14 : oy + 4;
    s += `<text class="dv-mark${k === i ? ' on' : ''}" x="${tx}" y="${ty}" text-anchor="${hz ? 'middle' : 'end'}">${esc(l)}</text>`;
  });
  return s;
}

function drawLeds(p, c, st) {
  // A column (or grid) of LEDs with labels, and the button that steps through them.
  const sel = st && st.opt != null ? String(st.opt).toLowerCase() : null;
  let s = '';
  const rows = Math.ceil(c.opts.length / c.cols);
  c.opts.forEach(([v, l], k) => {
    const col = Math.floor(k / rows), row = k % rows;
    const x = c.x + col * (c.dx || 62), y = c.y + row * (c.dy || 26);
    const on = sel != null && v.toLowerCase() === sel;
    s += `<circle class="dv-led${on ? ' on' : ''}" cx="${x}" cy="${y}" r="5"/><path class="sk thin" d="${p.ellipse(x, y, 5.5, 5.5, false)}"/><text class="dv-mark${on ? ' on' : ''}" x="${x + 11}" y="${y + 4}">${esc(l)}</text>`;
  });
  if (c.button) { const bx = c.x + (c.cols > 1 ? 40 : 26), by = c.y + rows * (c.dy || 26) + 8; s += `<path class="sk" d="${p.rect(bx - 11, by - 9, 22, 20)}"/>`; }
  return s;
}

function drawControl(p, c, st, n) {
  let s = '';
  if (c.kind === 'knob') s += drawKnob(p, c, st);
  else if (c.kind === 'rotary') s += drawRotary(p, c, st);
  else if (c.kind === 'switch') s += drawSwitch(p, c, st);
  else if (c.kind === 'leds') s += drawLeds(p, c, st);
  else if (c.kind === 'jack') s += `<path class="sk" d="${p.ellipse(c.x, c.y, 16, 16)}"/><path class="kn-black" d="${p.blob(c.x, c.y, 8, 8, 0.05)}"/>`;
  else if (c.kind === 'foot') s += `<path class="kn-cream" d="${p.blob(c.x, c.y, 30, 30, 0.05)}"/><path class="sk heavy" d="${p.ellipse(c.x, c.y, 30, 30)}"/><path class="sk" d="${p.ellipse(c.x, c.y, 20, 20, false)}"/>${st ? `<path class="sk red" d="${p.ellipse(c.x, c.y, 38, 38, false)}"/>` : ''}`;
  else if (c.kind === 'screen') s += `<rect class="dv-screen" x="${c.x + 2}" y="${c.y + 2}" width="${c.w - 4}" height="${c.h - 4}" rx="3"/><path class="sk" d="${p.rect(c.x, c.y, c.w, c.h)}"/>`;
  else if (c.kind === 'pad') s += `<path class="sk thin${st ? ' red' : ''}" d="${p.rect(c.x - 12, c.y - 12, 24, 24, false)}"/>${st ? `<path class="wash hi" d="${p.blob(c.x, c.y, 11, 11, 0.1)}"/>` : ''}`;
  else if (c.kind === 'button') {
    const lit = st && (st.on || st.opt === 'on');
    s += `${lit ? `<path class="dv-lit" d="${p.blob(c.x, c.y, c.w / 2 + 3, c.h / 2 + 3, 0.1)}"/>` : ''}<path class="sk${lit ? ' red' : ''}" d="${c.round ? p.ellipse(c.x, c.y, c.w / 2, c.h / 2) : p.rect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h)}"/>`;
    if (c.inner && c.label) s += `<text class="dv-key" x="${c.x}" y="${c.y + 4}" text-anchor="middle">${esc(c.label)}</text>`;
  }
  const below = { knob: c.r, rotary: c.r + 8, switch: c.opts ? (c.horizontal ? 9 : 8 * c.opts.length + 4) : 0, jack: 16, foot: 30, button: c.h / 2 }[c.kind];
  if (c.label && !c.inner && below != null) s += `<text class="dv-label${st ? ' on' : ''}" x="${c.x}" y="${c.y + below + 16}" text-anchor="middle">${esc(c.label)}</text>`;
  if (c.sub) s += `<text class="dv-sub" x="${c.x}" y="${c.y + below + 30}" text-anchor="middle">${esc(c.sub)}</text>`;
  if (n) {
    const r = c.r || Math.max(c.w || 16, c.h || 16) / 2 || 14;
    let bx = c.x + r * 0.75 + 8, by = c.y - r * 0.75 - 6;
    if (c.kind === 'leds') { bx = c.x - 17; by = c.y - 2; }
    if (c.kind === 'switch') { bx = c.x + 16; by = c.y - 8 * c.opts.length - 8; }
    s += `<circle class="dv-badge" cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="9"/><text class="dv-badge-n" x="${bx.toFixed(1)}" y="${(by + 4).toFixed(1)}" text-anchor="middle">${n}</text>`;
  }
  return `<g class="dv-ctl${st ? ' set' : ''}" data-ctl="${esc(c.id)}">${s}</g>`;
}

function drawDecor(p, m, d, set) {
  if (d.rect) { const [x, y, w, h] = d.rect; return `<path class="sk thin" d="${p.rect(x, y, w, h, false)}"/>`; }
  if (d.line) { const [a, b, c, e] = d.line; return `<path class="sk thin" d="${p.line(a, b, c, e, false)}"/>`; }
  if (d.sec) { const [x, y, t] = d.sec; return `<text class="dv-sec" x="${x}" y="${y}" text-anchor="middle">${esc(t)}</text>`; }
  if (d.small) { const [x, y, t] = d.small; return `<text class="dv-small" x="${x}" y="${y}" text-anchor="middle">${esc(t)}</text>`; }
  if (d.tag) { const [x, y, t] = d.tag; return `<text class="dv-sec big" x="${x}" y="${y}" text-anchor="middle">${esc(t)}</text>`; }
  if (d.text) { const [x, y, t] = d.text; return `<text class="dv-title" x="${x}" y="${y}" text-anchor="middle">${esc(t)}</text>`; }
  if (d.title) { const [x, y, t, sub] = d.title; return `<text class="dv-title" x="${x}" y="${y}">${esc(t)}</text><text class="dv-sub" x="${x + 400}" y="${y}">${esc(sub)}</text>`; }
  if (d.logo) { const [x, y, t, sub] = d.logo; return `<text class="dv-logo" x="${x}" y="${y}" text-anchor="middle">${esc(t)}</text>${sub ? `<text class="dv-sub" x="${x}" y="${y + 24}" text-anchor="middle">${esc(sub)}</text>` : ''}`; }
  if (d.jacks) return d.jacks.map(([x, l]) => `<path class="sk" d="${p.rect(x - 16, 14, 32, 26)}"/><text class="dv-small" x="${x}" y="${66}" text-anchor="middle">${esc(l)}</text>`).join('');
  if (d.table) {
    // The Grand Canyon's printed delay-type table: the chosen row is outlined in red.
    const { x, y, w, rows, id } = d.table, rh = 17;
    const chosen = set[id] && set[id].opt ? String(set[id].opt).toUpperCase() : null;
    let s = `<path class="sk thin" d="${p.rect(x - 6, y - 4, w + 12, rows.length * rh + 8, false)}"/>`;
    rows.forEach(([t, l, r], k) => {
      const ty = y + k * rh + 12, on = chosen === t;
      s += `<circle class="dv-led${on ? ' on' : ''}" cx="${x + 2}" cy="${ty - 4}" r="3.5"/><text class="dv-tbl${on ? ' on' : ''}" x="${x + 10}" y="${ty}">${esc(t)}</text><text class="dv-tbl${on && set.mini_left ? ' on' : ''}" x="${x + 82}" y="${ty}">${esc(l)}</text><text class="dv-tbl${on && set.mini_right ? ' on' : ''}" x="${x + 152}" y="${ty}">${esc(r)}</text>`;
      if (on) s += `<path class="sk red" d="${p.rect(x - 4, ty - 13, w + 8, rh, false)}"/>`;
    });
    return s;
  }
  return '';
}

// set: { controlId: state }  state: { f: 0..1 } | { opt: 'name' } | { on: true }
// view: region names to show (their bounding box), default 'all'. numbers: { controlId: n } for numbered badges.
function render(id, { set = {}, view = ['all'], numbers = {}, caption = '', seed = '', fitX = 0 } = {}) {
  const m = MODELS[id];
  const p = pen(`device:${id}:${seed}`);
  const boxes = view.map(v => m.regions[v]).filter(Boolean);
  let x0 = Math.min(...boxes.map(b => b[0])), y0 = Math.min(...boxes.map(b => b[1]));
  let x1 = Math.max(...boxes.map(b => b[0] + b[2])), y1 = Math.max(...boxes.map(b => b[1] + b[3]));
  // fitX: zoom in sideways to the controls that are set, keeping fitX units of panel around them.
  if (fitX) {
    const xs = m.controls.filter(c => set[c.id] && c.y >= y0 && c.y <= y1).map(c => c.x);
    if (xs.length) { x0 = Math.max(x0, Math.min(...xs) - fitX); x1 = Math.min(x1, Math.max(...xs) + fitX); }
  }
  const inView = (x, y) => x >= x0 - 20 && x <= x1 + 20 && y >= y0 - 20 && y <= y1 + 20;
  const [bx, by, bw, bh] = m.body;
  let s = `<path class="wash soft" d="${p.blob(bx + bw / 2, by + bh / 2, bw / 2, bh / 2, 0.03)}"/><path class="sk heavy" d="${p.rect(bx, by, bw, bh)}"/>`;
  for (const d of m.decor) s += drawDecor(p, m, d, set);
  for (const c of m.controls) if (inView(c.x, c.y)) s += drawControl(p, c, set[c.id], numbers[c.id]);
  const any = Object.keys(set).length > 0;
  const W = x1 - x0, H = y1 - y0;
  return `<figure class="dev-sketch dev-${id}${any ? ' has-set' : ''}"><svg viewBox="${x0} ${y0} ${W} ${H}" role="img" aria-label="Sketch of the ${esc(m.name)}${any ? `, with ${Object.keys(set).length} controls set` : ''}">${s}</svg>${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
}

// ───────── From a recipe row to a control ─────────
const knobF = v => {
  const s = String(v).trim().toLowerCase();
  if (s === 'min') return 0; if (s === 'max') return 1; if (s === 'noon') return 0.5;
  const st = s.match(/^step (\d+)\/(\d+)$/); if (st) return (st[1] - 1) / (st[2] - 1);
  const m = s.match(/^(\d{1,2})(?::(\d{2}))? o'clock$/); if (!m) return null;
  let h = Number(m[1]) + (m[2] ? Number(m[2]) / 60 : 0); if (h < 7) h += 12;
  const f = (h - 7) / 10; return f >= 0 && f <= 1 ? f : null;
};
const choice = v => { const m = String(v).match(/^\[(.+)\]$/); if (!m) return null; const on = m[1].split('|').map(x => x.trim()).find(x => /^\*.*\*$/.test(x)); return on ? on.slice(1, -1) : null; };

const ALIAS = {
  pf: { WAVE: 'wave', OCTAVE: 'octave', GLIDE: 'glide', 'OSCILLATOR EG INT': 'vco_eg', 'OSCILLATOR LFO INT': 'vco_lfo', TUNE: 'tune', CUTOFF: 'cutoff', RESONANCE: 'resonance', 'FILTER EG INT': 'vcf_eg', 'FILTER LFO INT': 'vcf_lfo', TRACK: 'track', ATTACK: 'attack', DECAY: 'decay', SUSTAIN: 'sustain', RELEASE: 'release', 'LFO WAVE': 'lfo_wave', 'LFO SPEED/PHASE': 'lfo_speed', 'LFO SPEED': 'lfo_speed', 'VCA MODE': 'vca_mode', PAN: 'pan', VOLUME: 'volume', PLAYMODE: '=playmode', 'MASTER VOLUME': '=master_volume' },
  gc: { 'DELAY LVL': 'delay_lvl', 'LOOP LVL': 'loop_lvl', FEEDBACK: 'feedback', DELAY: 'delay', 'DELAY TYPE': 'delay_type', 'PING PONG': 'ping_pong', TAILS: 'tails' },
  ns: { SPEED: 'speed', DEPTH: 'depth', TARGET: 'target', SHAPE: 'shape', LENGTH: 'length', TEXTURE: 'texture', 'SIZE/PITCH': 'size', QUANTIZE: 'quantize', REVERB: 'reverb', 'LOW CUT': 'low_cut', FILTER: 'filter', 'HIGH CUT': 'high_cut', INTERVAL: 'interval', 'SHIMMER (BUTTON)': 'shimmer_btn', 'SHIMMER (KNOB)': 'shimmer', SHIMMER: 'shimmer', GLIMMER: 'glimmer', DRIVE: 'drive', DRY: 'dry' },
};
const PF_OPT = { 'saw or square': 'saw or square' };

// A recipe row → { id, state } on the device, or null when the row isn't a panel control.
function resolve(dev, name, value, ctx = {}) {
  let n = String(name).trim(), ch = ctx.channel || 1;
  const cm = n.match(/^(?:Ch|Channel)\s*(\d)\s+(.*)$/i); if (cm) { ch = Number(cm[1]); n = cm[2]; }
  n = n.replace(/\s*\(all\)\s*$/i, '').toUpperCase();
  if (dev === 'gc') {
    if (/\(LEFT MINI KNOB\)/.test(n)) n = 'MINI_LEFT'; else if (/\(RIGHT MINI KNOB\)/.test(n)) n = 'MINI_RIGHT';
  }
  let key = dev === 'gc' && /^MINI_/.test(n) ? n.toLowerCase() : (ALIAS[dev] || {})[n];
  if (!key) return null;
  const global = key.startsWith('='); key = key.replace(/^=/, '');
  const id = dev === 'pf' && !global ? `c${ch}.${key}` : key;
  const c = MODELS[dev].controls.find(x => x.id === id);
  if (!c) return null;
  const v = String(value).trim();
  let state = null;
  if (c.kind === 'knob') { const f = knobF(v); if (f != null) state = { f }; }
  else if (c.kind === 'rotary' || c.kind === 'switch' || c.kind === 'leds') {
    let o = choice(v) || v;
    o = PF_OPT[o] || o;
    if (c.kind === 'rotary' && dev === 'gc') o = o.toUpperCase();
    if (/^off$/i.test(o)) state = { opt: null, off: true }; else state = { opt: o };
  } else if (c.kind === 'button') { const o = choice(v); state = { on: o ? o === 'on' : true }; if (!state.on) state = null; }
  return state ? { id, state, channel: ch } : null;
}

module.exports = { MODELS, render, resolve };
