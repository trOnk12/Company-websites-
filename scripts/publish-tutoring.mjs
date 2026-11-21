#!/usr/bin/env node
// Publishes the tutoring offer (https://pachulski.dev/korepetycje/) where an official API allows it:
//
//   facebook  a post on Mateusz's own Facebook Page (Graph API: POST /{page-id}/feed). Facebook GROUPS can't be
//             posted to by any app since Meta removed the Groups API in April 2024: share the Page post into
//             groups by hand (one tap: "Udostępnij → W grupie").
//   olx       one advert through the OLX Poland Partner API (POST /api/partner/adverts), created with
//             auto_extend_enabled so OLX keeps it alive; later runs update it (PUT) instead of posting again.
//
// Nothing is sent unless you pass --send. Without it the script prints exactly what it would send.
// Credentials come from environment variables only (GitHub Actions secrets or your shell), never the repo:
//   FB_PAGE_ID, FB_PAGE_TOKEN                      (a long-lived Page access token with pages_manage_posts)
//   OLX_CLIENT_ID, OLX_CLIENT_SECRET, OLX_REFRESH_TOKEN
//   OLX_CATEGORY_ID, OLX_CITY_ID, OLX_CONTACT_NAME [, OLX_CONTACT_PHONE] [, OLX_ADVERT_ID once it exists]
//
// Usage:
//   node scripts/publish-tutoring.mjs facebook            # dry run
//   node scripts/publish-tutoring.mjs facebook --send
//   node scripts/publish-tutoring.mjs olx-categories [parentId]   # find the tutoring category id (needs client id/secret)
//   node scripts/publish-tutoring.mjs olx-attributes <categoryId> # which attributes that category requires
//   node scripts/publish-tutoring.mjs olx-token <code>             # one-off: exchange the code from /korepetycje/olx/
//   node scripts/publish-tutoring.mjs olx [--send]

const URL_PAGE = 'https://pachulski.dev/korepetycje/';
const GRAPH = 'https://graph.facebook.com/v21.0';
const OLX = 'https://www.olx.pl/api';

// Posts rotate by ISO week, so a weekly or fortnightly schedule never repeats the same text twice in a row.
const POSTS = [
  `Dzień dobry! Mam na imię Mateusz, mieszkam w Lginiu koło Wschowy. Prowadzę indywidualne korepetycje z matematyki online dla klas 4–6, 45 zł za 45 minut. Na pierwszą lekcję wystarczy jedno zadanie z zeszytu, z którym dziecko ma kłopot: rozrysujemy je razem krok po kroku.`,
  `Ułamki, procenty, zadania tekstowe? Uczę matematyki klasy 4–6 online, jeden na jeden, 45 zł za 45 minut. Najpierw rysujemy, potem liczymy. Na stronie można wypróbować przykładowe zadanie z ułamków i zaproponować termin.`,
  `Szukasz korepetycji z matematyki dla dziecka z klasy 4, 5 lub 6? Prowadzę lekcje online z okolic Wschowy (Lgiń), 45 zł za 45 minut. Proszę napisać, z czym dziecko ma trudność, a zaproponuję termin.`,
];
const week = () => { const d = new Date(); const t = Date.UTC(d.getUTCFullYear(), 0, 1); return Math.floor((d - t) / 6048e5); };
const post = () => POSTS[week() % POSTS.length];

const SEND = process.argv.includes('--send');
const args = process.argv.slice(2).filter(a => a !== '--send');
const need = (...names) => { const miss = names.filter(n => !process.env[n]); if (miss.length) { console.error(`Missing environment variables: ${miss.join(', ')}`); process.exit(2); } };
const show = (what, req) => console.log(`${SEND ? 'Sending' : 'DRY RUN, would send'} ${what}:\n${JSON.stringify(req, (k, v) => /token|secret/i.test(k) ? '***' : v, 2)}`);

async function call(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  if (!res.ok) { console.error(`HTTP ${res.status} from ${url}\n${typeof body === 'string' ? body : JSON.stringify(body, null, 2)}`); process.exit(1); }
  return body;
}

async function facebook() {
  need('FB_PAGE_ID', 'FB_PAGE_TOKEN');
  const req = { url: `${GRAPH}/${process.env.FB_PAGE_ID}/feed`, message: post(), link: URL_PAGE };
  show('a Facebook Page post', req);
  if (!SEND) return;
  const r = await call(req.url, { method: 'POST', body: new URLSearchParams({ message: req.message, link: req.link, access_token: process.env.FB_PAGE_TOKEN }) });
  console.log(`Posted: https://www.facebook.com/${r.id}\nNow share it into the local groups by hand (Udostępnij → W grupie).`);
}

// OLX tokens: the client-credentials token can read categories; adverts need the user's token, renewed from the
// refresh token (refresh tokens last a month, so a fortnightly run keeps them alive).
async function olxToken(grant) {
  need('OLX_CLIENT_ID', 'OLX_CLIENT_SECRET');
  const body = { client_id: process.env.OLX_CLIENT_ID, client_secret: process.env.OLX_CLIENT_SECRET, scope: 'v2 read write', ...grant };
  return call(`${OLX}/open/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
const olxHeaders = token => ({ Authorization: `Bearer ${token}`, Version: '2.0', 'Content-Type': 'application/json' });

async function olxCategories(parent) {
  const { access_token } = await olxToken({ grant_type: 'client_credentials' });
  const r = await call(`${OLX}/partner/categories${parent ? `?parent_id=${parent}` : ''}`, { headers: olxHeaders(access_token) });
  for (const c of r.data || []) console.log(`${c.id}\t${c.is_leaf ? 'leaf' : '…'}\t${c.name}`);
}
async function olxAttributes(id) {
  const { access_token } = await olxToken({ grant_type: 'client_credentials' });
  console.log(JSON.stringify(await call(`${OLX}/partner/categories/${id}/attributes`, { headers: olxHeaders(access_token) }), null, 2));
}
async function olxExchange(code) {
  const r = await olxToken({ grant_type: 'authorization_code', code });
  console.log(`Save this as the secret OLX_REFRESH_TOKEN (valid about a month; each run renews it):\n${r.refresh_token}`);
}

async function olx() {
  need('OLX_CATEGORY_ID', 'OLX_CITY_ID', 'OLX_CONTACT_NAME');
  const advert = {
    title: 'Korepetycje z matematyki online, klasy 4–6',
    description: `${POSTS[0]}\n\nZasady: lekcje indywidualne online, 45 minut, 45 zł. Kontakt przez wiadomość OLX lub stronę ${URL_PAGE}`,
    category_id: Number(process.env.OLX_CATEGORY_ID),
    advertiser_type: 'private',
    contact: { name: process.env.OLX_CONTACT_NAME, ...(process.env.OLX_CONTACT_PHONE ? { phone: process.env.OLX_CONTACT_PHONE } : {}) },
    location: { city_id: Number(process.env.OLX_CITY_ID) },
    price: { value: 45, currency: 'PLN', negotiable: false },
    attributes: JSON.parse(process.env.OLX_ATTRIBUTES || '[]'),
    external_url: URL_PAGE,
    auto_extend_enabled: true,
  };
  const id = process.env.OLX_ADVERT_ID;
  show(id ? `an update of OLX advert ${id}` : 'a new OLX advert', advert);
  if (!SEND) return;
  need('OLX_REFRESH_TOKEN');
  const tok = await olxToken({ grant_type: 'refresh_token', refresh_token: process.env.OLX_REFRESH_TOKEN });
  if (tok.refresh_token && tok.refresh_token !== process.env.OLX_REFRESH_TOKEN) console.log(`New refresh token (update the OLX_REFRESH_TOKEN secret):\n${tok.refresh_token}`);
  const r = await call(`${OLX}/partner/adverts${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', headers: olxHeaders(tok.access_token), body: JSON.stringify(advert) });
  const newId = r.data && r.data.id;
  console.log(id ? `Updated advert ${id}.` : `Created advert ${newId}. Save it as OLX_ADVERT_ID so later runs update it instead of posting a duplicate.`);
}

const [cmd, arg] = args;
const run = { facebook, olx, 'olx-categories': () => olxCategories(arg), 'olx-attributes': () => olxAttributes(arg), 'olx-token': () => olxExchange(arg) }[cmd];
if (!run) { console.log('Commands: facebook | olx | olx-categories [parentId] | olx-attributes <categoryId> | olx-token <code>   (add --send to really publish)'); process.exit(cmd ? 2 : 0); }
await run();
