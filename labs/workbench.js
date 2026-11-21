'use strict';

const experiment = document.querySelector('#experiment');
const variant = document.querySelector('#variant');
const result = document.querySelector('#result');
const lesson = document.querySelector('#lesson');
for (const item of experiments) experiment.add(new Option(item.title, item.slug));

function loadExperiment() {
  const item = experiments.find(entry => entry.slug === location.hash.slice(1)) || experiments[0];
  experiment.value = item.slug;
  document.querySelector('#fixture').textContent = item.fixture;
  document.querySelector('#question').textContent = item.question;
  variant.replaceChildren(...item.options.map((label, index) => new Option(label, index)));
  result.replaceChildren();
  lesson.href = '../../course/' + document.querySelector('[data-lab-course]').dataset.labCourse + '/' + item.slug + '.html';
  lesson.textContent = 'Return to lesson · ' + item.title;
}

experiment.addEventListener('change', () => { location.hash = experiment.value; });
window.addEventListener('hashchange', loadExperiment);
variant.addEventListener('change', () => result.replaceChildren());
document.querySelector('form').addEventListener('submit', event => {
  event.preventDefault();
  const item = experiments.find(entry => entry.slug === experiment.value);
  const [trace, explanation] = item.run(Number(variant.value));
  const heading = document.createElement('h2');
  heading.textContent = 'Run result';
  const output = document.createElement('pre');
  output.textContent = trace;
  const note = document.createElement('p');
  note.textContent = explanation;
  result.replaceChildren(heading, output, note);
});
loadExperiment();
