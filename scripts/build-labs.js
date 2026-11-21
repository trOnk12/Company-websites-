'use strict';

const fs = require('fs');
const path = require('path');
const L = require('./build-learning');

const courses = {
  'backend-ops': 'Backend operations',
  jvm: 'JVM fundamentals',
  'system-design': 'System design',
};

function labPage({file, course, title, intro, body, scripts, parent}) {
  const base = '../../';
  const courseUrl = base + 'course/' + course + '/';
  const crumbs = [
    ['Courses', base + 'course/'], [courses[course], courseUrl],
  ];
  if (parent) crumbs.push(parent);
  const breadcrumb = crumbs.map(([text, href]) => `<a href="${href}">${L.esc(text)}</a>`).join('<span aria-hidden="true">/</span>');
  return L.page({
    title: title + ' – ' + courses[course] + ' – Mateusz Pachulski',
    description: intro,
    canonical: L.SITE + '/labs/' + file.replace(/index\.html$/, ''),
    base, current: 'courses', feed: false, script: scripts, styles: ['../lab.css'],
    body: `    <article class="lab wrap narrow" data-lab-course="${course}">
      <nav class="lesson-context" aria-label="Breadcrumb">${breadcrumb}</nav>
      <header class="lab-intro"><h1>${L.esc(title)}</h1><p class="lede">${L.esc(intro)}</p></header>
      ${body}
    </article>`,
    footer: `      <p class="small"><a href="${courseUrl}">${courses[course]} course</a> · <a href="../../course/me.html">Your learning</a> · <a href="../../course/">All courses</a></p>`,
  });
}

function workbench(course, directory) {
  return {
    file: directory + '/index.html', course, title: courses[course] + ' workbench',
    intro: 'Change one condition, predict the outcome, then run the model. Each run starts from the stated fixture.',
    scripts: ['experiments.js', '../workbench.js'],
    body: `<noscript>Enable JavaScript to run this model, or <a href="../../course/${course}/">read the course lessons</a>.</noscript>
      <section class="lab-card" aria-label="Experiment">
        <div class="lab-field"><label for="experiment">Experiment</label><select id="experiment"></select></div>
        <p id="fixture"></p>
        <form><div class="lab-field"><label for="variant" id="question">Condition</label><select id="variant"></select></div>
          <button type="submit" class="button primary">Run experiment</button></form>
        <div id="result" role="status" aria-live="polite" aria-atomic="true"></div>
      </section>
      <p class="lab-return"><a id="lesson" href="../../course/${course}/">Return to course</a></p>`,
  };
}

function casesPage() {
  const file = path.join(L.ROOT, 'labs/parking-design/cases.md');
  const ctx = {file, cards: new Map(), links: new Set()};
  const markdown = fs.readFileSync(file, 'utf8');
  const [opening, ...sections] = markdown.trim().split(/^## /m);
  const [heading, intro] = opening.trim().split(/\n\n/);
  const cards = sections.map(section => {
    const parsed = L.parseBody('## ' + section, ctx)[0];
    const blocks = parsed.blocks.map(block => {
      if (block.type === 'p' && block.text === '<details><summary>Worked review and failure drill</summary>') return block.text;
      if (block.type === 'p' && block.text === '</details>') return block.text;
      return L.renderBlocks([block], ctx);
    });
    const id = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `<section class="lab-card" id="${id}"><h2>${L.esc(parsed.title)}</h2>\n${blocks.join('\n')}\n</section>`;
  });
  return {
    file: 'parking-design/cases.html', course: 'system-design', title: heading.replace(/^# /, ''), intro,
    parent: ['Reservation lab', './'],
    body: cards.join('\n') + '\n<p class="lab-return"><a href="../../course/system-design/14-design-review.html#try-it">Return to the design review lesson</a></p>',
  };
}

function labPages() {
  const reservation = {
    file: 'parking-design/index.html', course: 'system-design', title: 'Reservation lab',
    intro: 'One parking space. Two phones. Ada and Ben have different request IDs. Choose who sends first, then inspect what committed.',
    scripts: ['lab.js'],
    body: `<nav class="lesson-jumps" aria-label="Experiments"><a href="#race">Last space</a><a href="#retry">Lost reply</a><a href="#isolation">Isolation</a><a href="#queue">Overload</a><a href="cases.html">Design review</a></nav>
      ${fs.readFileSync(path.join(__dirname, 'lab-templates/reservation.html'), 'utf8')}`,
  };
  const pages = [reservation, casesPage(), workbench('backend-ops', 'backend-workbench'), workbench('jvm', 'jvm-workbench')];
  return new Map(pages.map(config => [path.join(L.ROOT, 'labs', config.file), labPage(config)]));
}

module.exports = {labPages};
