"""Verify published file links, fragments, lesson exports and browser exercise routes."""
import json
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://pachulski.dev/"


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = Counter()
        self.links = []
        self.feed(path.read_text())
        self.close()

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids[values["id"]] += 1
        attr = {"a": "href", "script": "src", "img": "src", "link": "href"}.get(tag)
        if attr and values.get(attr) and "canonical" != values.get("rel"):
            self.links.append(values[attr])


def run():
    paths = [ROOT / "index.html"]
    for directory in ("course", "learning", "music", "labs"):
        paths.extend((ROOT / directory).rglob("*.html"))
    pages = {path.relative_to(ROOT).as_posix(): Page(path) for path in paths}
    errors = []
    topics = 0
    for folder in sorted((ROOT / "_course").iterdir()):
        source = folder / "course.json"
        if not source.exists():
            continue
        config = json.loads(source.read_text())
        target = ROOT / "course" / folder.name
        with ZipFile(target / (folder.name + "-obsidian.zip")) as archive:
            if archive.testzip():
                errors.append(f"{folder.name}: damaged offline archive")
            notes = [archive.read(name).decode() for name in archive.namelist() if name.endswith(".md")]
            text = "\n".join(notes)
            for module in config["modules"]:
                for lesson in module["puzzles"]:
                    slug = Path(lesson).stem
                    if not (target / (slug + ".html")).is_file():
                        errors.append(f"{folder.name}: missing puzzle {slug}")
            for chapter in json.loads((folder / "topics.json").read_text()):
                for lesson in chapter["lessons"]:
                    topics += 1
                    if lesson["source"] not in text or lesson["answer"] not in text:
                        errors.append(f"{folder.name}: incomplete export of {lesson['title']}")

    workbenches = {"labs/backend-workbench/index.html": "backend-ops", "labs/jvm-workbench/index.html": "jvm"}
    for path, page in pages.items():
        for name, count in page.ids.items():
            if count > 1:
                errors.append(f"{path}: duplicate id {name}")
        for href in page.links:
            url = urlsplit(urljoin(ORIGIN + path, href))
            if url.hostname != "pachulski.dev":
                continue
            dest = unquote(url.path).lstrip("/")
            if not dest or dest.endswith("/"):
                dest += "index.html"
            if not (ROOT / dest).is_file():
                errors.append(f"{path}: missing file {href}")
            elif url.fragment and dest in pages and unquote(url.fragment) not in pages[dest].ids:
                course = workbenches.get(dest)
                if course and url.fragment in {p.stem for p in (ROOT / "_course" / course).glob("[0-9]*.md")}:
                    continue  # These fragments select the experiment in the browser.
                errors.append(f"{path}: missing target {href}")
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"Verified internal links on {len(pages)} pages and {topics} exported practice topics.")


if __name__ == "__main__":
    run()
