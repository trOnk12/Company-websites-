'use strict';

// These browser models evaluate the small programs described by each fixture.
const experiments = [
  {
    slug: '00-class-file', title: 'Source and compiled instructions',
    fixture: 'The compiled helper returns x + 1. Edit the source to return x + 2. The caller passes 7.',
    question: 'Which action comes after the edit?', options: ['Launch the existing class', 'Compile the edited source, then launch'],
    run(choice) {
      const source = 2;
      let compiled = 1;
      if (choice) compiled = source;
      return [`Source increment: ${source}\nClass increment: ${compiled}\nPrinted: ${7 + compiled}`,
        'The launcher consumes the compiled instructions. A source edit changes a later run once compilation replaces the class file.'];
    }
  },
  {
    slug: '01-frame', title: 'Trace a method call',
    fixture: 'A caller stores 7 in a local. It calls increment(7), which executes iload_0, iconst_1, iadd, ireturn.',
    question: 'Pause after which instruction?', options: ['iload_0', 'iconst_1', 'iadd', 'ireturn'],
    run(choice) {
      const stack = [];
      const trace = ['Caller local: 7', 'New helper frame: local slot 0 = 7'];
      stack.push(7);
      trace.push('iload_0 → stack [' + stack + ']');
      if (choice >= 1) { stack.push(1); trace.push('iconst_1 → stack [' + stack + ']'); }
      if (choice >= 2) { const right = stack.pop(); stack.push(stack.pop() + right); trace.push('iadd → stack [' + stack + ']'); }
      if (choice === 3) trace.push('ireturn → caller receives ' + stack.pop() + '; helper frame removed');
      return [trace.join('\n'), 'Method calls copy the argument into a new frame. Observe where each intermediate value lives and when it disappears.'];
    }
  },
  {
    slug: '02-reference', title: 'Mutation and reassignment',
    fixture: 'first and second refer to object A, whose field is 7. The helper receives a copy of the reference in second.',
    question: 'In what order does the helper act?', options: ['Write 8, then point its parameter at B', 'Point its parameter at B, then write 8'],
    run(choice) {
      const first = { value: 7 };
      const second = first;
      const replacement = { value: 99 };
      let parameter = second;
      if (choice) parameter = replacement;
      parameter.value = 8;
      if (!choice) parameter = replacement;
      return [`first.value = ${first.value}\nsecond.value = ${second.value}\nhelper parameter before return = B (${parameter.value})`,
        'Both caller variables still reach A. The field assignment changes whichever object the helper parameter reaches at the moment of that instruction.'];
    }
  },
  {
    slug: '03-reachability', title: 'Trace live references',
    fixture: 'A stack local and a static cache both refer to A. Object A refers to B. There are no other roots or edges in this model.',
    question: 'Which references will you remove?', options: ['Clear only the local', 'Clear the local and the cache', 'Clear the local and remove the edge A → B'],
    run(choice) {
      const roots = choice === 1 ? [] : ['A'];
      const edges = { A: choice === 2 ? [] : ['B'], B: [] };
      const seen = new Set();
      function visit(node) { if (!seen.has(node)) { seen.add(node); edges[node].forEach(visit); } }
      roots.forEach(visit);
      const eligible = Object.keys(edges).filter(name => !seen.has(name));
      return [`Roots after edit: ${roots.length ? 'cache → A' : 'none'}\nReachable: ${[...seen].join(', ') || 'none'}\nEligible for collection: ${eligible.join(', ') || 'none'}`,
        'Follow every edge from each live root. Eligibility tells you which objects could be reclaimed, while the runtime chooses when to collect.'];
    }
  },
  {
    slug: '04-shared-counter', title: 'Race two increments',
    fixture: 'A and B both read 7 before either writes. Each wants to increment the same counter once.',
    question: 'Choose the write rule.', options: ['Both store their calculated value', 'Compare and set; stop on conflict', 'Compare and set; retry on conflict'],
    run(choice) {
      let value = 7;
      const a = value, b = value;
      value = a + 1;
      const accepts = choice === 0 || b === value;
      if (accepts) value = b + 1;
      if (!accepts && choice === 2) value += 1;
      return [`A writes 8\nB's first write: ${accepts ? 'accepted' : 'rejected'}\nFinal counter: ${value}`,
        'Comparing and replacing together detects an outdated snapshot. A rejected increment still needs to be applied using the new value.'];
    }
  }
];
