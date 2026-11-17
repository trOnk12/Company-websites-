#!/usr/bin/env python3
"""Insert or reorder puzzles in a course and renumber everything that depends on the order.

Usage: python3 scripts/course-renumber.py <course> <plan.json>
plan.json: {"modules": [["slug-a", "slug-b"], ["slug-c", ...]]}   slugs without the NN- prefix, in the new order.

It renames _course/<course>/NN-slug.md to the new numbers, rewrites course.json's module puzzle lists (keeping titles
and blurbs), remaps glossary "in" numbers, rewrites "puzzle N" / "puzzles N and M" references inside this course's
puzzles (skipping ones that name another course just before), and remaps other courses' glossary "from" entries
that point into this course. New slugs must already exist as files named with any NN- prefix (e.g. 99-new.md).
"""
import json, os, re, sys

ROOT = os.path.join(os.path.dirname(__file__), '..', '_course')
course, plan_file = sys.argv[1], sys.argv[2]
d = os.path.join(ROOT, course)
plan = json.load(open(plan_file))
files = {re.sub(r'^\d\d-', '', f[:-3]): f for f in os.listdir(d) if re.match(r'^\d\d-.*\.md$', f)}
old_num = {slug: int(f[:2]) for slug, f in files.items()}
order = [s for m in plan['modules'] for s in m]
missing = [s for s in order if s not in files]
if missing: sys.exit(f'no file for: {missing}')
new_num = {s: i for i, s in enumerate(order)}
# old number → new number, for puzzles that existed before (new files carry a placeholder number like 99)
remap = {old_num[s]: new_num[s] for s in order if old_num[s] < 90}

# 1. rename through a temporary name to avoid collisions
for s in order: os.rename(os.path.join(d, files[s]), os.path.join(d, f'tmp-{s}.md'))
for s in order: os.rename(os.path.join(d, f'tmp-{s}.md'), os.path.join(d, f'{new_num[s]:02d}-{s}.md'))

# 2. course.json modules
cj = os.path.join(d, 'course.json'); c = json.load(open(cj))
for k, m in enumerate(plan['modules']):
    if k < len(c['modules']): c['modules'][k]['puzzles'] = [f'{new_num[s]:02d}-{s}.md' for s in m]
    else: c['modules'].append({'title': f'Module {k + 1}', 'blurb': '', 'puzzles': [f'{new_num[s]:02d}-{s}.md' for s in m]})
open(cj, 'w').write(json.dumps(c, indent=2, ensure_ascii=False) + '\n')

# 3. glossary "in"
gj = os.path.join(d, 'glossary.json'); g = json.load(open(gj))
new_files = {old_num[s]: new_num[s] for s in order if old_num[s] >= 90}
for t, v in g['terms'].items():
    n = int(v['in'])
    if n in remap: v['in'] = f'{remap[n]:02d}'
    elif n in new_files: v['in'] = f'{new_files[n]:02d}'
open(gj, 'w').write(json.dumps(g, indent=1, ensure_ascii=False) + '\n')

# 4. "puzzle N" references inside this course's puzzles and diagrams (not "the X course, puzzle N")
def fix(text):
    def one(m):
        if re.search(r'course[,)]?\s*$', text[max(0, m.start() - 30):m.start()]): return m.group(0)
        nums = re.sub(r'\d+', lambda n: str(remap.get(int(n.group(0)), int(n.group(0)))), m.group(2))
        return m.group(1) + nums
    return re.sub(r'(\b[Pp]uzzles? )(\d+(?:(?:,| and| or|–|-) ?\d+)*)', one, text)
for s in order:
    p = os.path.join(d, f'{new_num[s]:02d}-{s}.md')
    if old_num[s] < 90:
        txt = open(p).read()
        open(p, 'w').write(fix(txt))
for f in os.listdir(os.path.join(d, 'diagrams')):
    p = os.path.join(d, 'diagrams', f)
    txt = open(p).read()
    open(p, 'w').write(fix(txt))

# 5. other courses' "from" entries pointing here
for other in os.listdir(ROOT):
    og = os.path.join(ROOT, other, 'glossary.json')
    if other == course or not os.path.exists(og): continue
    o = json.load(open(og)); changed = False
    for t, v in o.get('from', {}).items():
        if v.get('course') == course and int(v['in']) in remap: v['in'] = remap[int(v['in'])]; changed = True
    if changed: open(og, 'w').write(json.dumps(o, indent=1, ensure_ascii=False) + '\n')
print('renumbered', course, {s: new_num[s] for s in order})
