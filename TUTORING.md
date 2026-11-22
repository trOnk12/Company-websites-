# Korepetycje: jak zdobyć pierwszych uczniów

Strona: https://pachulski.dev/korepetycje/ (po polsku, dla rodziców i uczniów z okolicy). Oferta: matematyka od 4 klasy do matury, online
albo na miejscu w okolicy Wschowy: 45 zł (klasy 4–6), 50 zł (7–8, egzamin ósmoklasisty), 60 zł (liceum, technikum,
matura) za 45 minut; pierwsze 20 minut za darmo. Zmiany na stronie nie mogą psuć wyglądu, który Mateusz zaakceptował.

## Zrobione na stronie (21 listopada 2026)

- Tytuł i opis z frazami, których szuka rodzic: „korepetycje z matematyki online, klasy 4–6, Wschowa”.
- Adres kanoniczny, strona w `sitemap.xml`, dane strukturalne (usługa, cena 45 zł, Lgiń, Wschowa).
- Podgląd linku na Facebooku, Messengerze i WhatsAppie: `korepetycje/og.png` (zdjęcie, cena, klasy).
- Test: `tests/tutoring.test.js`.

## Do zrobienia przez Mateusza (to przyniesie uczniów szybciej niż sama strona)

1. **Wizytówka w Google (Google Business Profile)** jako firma usługowa bez adresu publicznego: obszar Wschowa,
   Lgiń, Sława, Góra; kategoria „Korepetytor”; link do strony. To ona pokazuje się w Mapach na „korepetycje
   matematyka Wschowa”.
2. **Profil na e-korepetycje.net**: dopisać matematykę (od 4 klasy do matury) i link do strony; tam są już opinie 5,0/5.
3. **Lokalne grupy na Facebooku** (Wschowa, Sława, Lgiń, grupy rodziców szkół): post poniżej; link pokaże podgląd.
4. **Ogłoszenie na tablicy** w szkole, bibliotece, sklepie w Lginiu: kartka A5 z ceną i kodem QR do strony.
5. **Numer telefonu** na stronie: wielu rodziców woli zadzwonić lub napisać SMS niż e-mail. Decyzja Mateusza;
   wtedy dodać przycisk „Zadzwoń” obok e-maila.

## Z telefonu jednym dotknięciem

`https://pachulski.dev/korepetycje/udostepnij/` (ukryta przed Google; dodaj do ekranu głównego telefonu):
wybierz jedną z 3 wersji tekstu i dotknij Facebook (udostępnij w grupie), WhatsApp, Messenger albo OLX;
tekst z linkiem jest od razu w schowku. Publikujesz Ty, więc to zgodne z regulaminami grup i Facebooka.
Automat z GitHub Actions też uruchomisz z telefonu: aplikacja GitHub → repozytorium → Actions →
„Publish tutoring offer” → Run workflow.

## Automatyczna publikacja (`scripts/publish-tutoring.mjs` + `.github/workflows/publish-tutoring.yml`)

Publikuje tylko tam, gdzie pozwala oficjalne API, i nic nie robi bez Twoich kluczy (sekrety w GitHub:
Settings → Secrets and variables → Actions). Bez `--send` skrypt tylko pokazuje, co by wysłał.

- **Fanpage na Facebooku**: co drugi poniedziałek post z linkiem do strony (3 wersje tekstu na zmianę).
  Załóż stronę „Korepetycje z matematyki – Mateusz Pachulski”, w Meta for Developers utwórz aplikację, wygeneruj
  długoterminowy token strony z uprawnieniem `pages_manage_posts`, zapisz `FB_PAGE_ID` i `FB_PAGE_TOKEN`.
- **Grupy na Facebooku: nie da się automatycznie.** Meta wyłączyła publikowanie w grupach przez API (kwiecień 2024);
  boty logujące się na prywatne konto łamią regulamin i kończą się blokadą. Udostępniaj post ze strony do grup
  ręcznie (Udostępnij → W grupie), raz na 2 tygodnie, zgodnie z zasadami każdej grupy.
- **OLX**: jedno ogłoszenie przez oficjalne Partner API, z automatycznym przedłużaniem; kolejne uruchomienia je
  aktualizują. Kroki (jednorazowo):
  1. developer.olx.pl → zaloguj się kontem OLX, „Partner details”, dodaj aplikację z Redirect URI
     `https://pachulski.dev/korepetycje/olx/`; po akceptacji OLX dostaniesz `OLX_CLIENT_ID` i `OLX_CLIENT_SECRET`.
  2. `node scripts/publish-tutoring.mjs olx-categories` (i dalej z `parentId`): znajdź kategorię korepetycji.
     Uwaga: przez API w Polsce działa tylko część kategorii; jeśli korepetycji tam nie ma, ogłoszenie dodaj
     ręcznie na olx.pl (raz; OLX sam je przedłuża), a skrypt pomiń.
  3. `olx-attributes <id>`: wymagane atrybuty kategorii → sekret `OLX_ATTRIBUTES` (JSON).
  4. Otwórz `https://www.olx.pl/oauth/authorize/?client_id=…&response_type=code&scope=read write v2&redirect_uri=https://pachulski.dev/korepetycje/olx/`,
     skopiuj kod ze strony i uruchom `olx-token <kod>` → sekret `OLX_REFRESH_TOKEN`.
  5. Sekrety `OLX_CATEGORY_ID`, `OLX_CITY_ID` (Lgiń lub Wschowa, z `/api/partner/cities`), `OLX_CONTACT_NAME`;
     po pierwszym ogłoszeniu `OLX_ADVERT_ID`. Pierwsze uruchomienie zrób ręcznie (Actions → Run workflow)
     i sprawdź ogłoszenie na OLX; format zapytania o token sprawdzimy wtedy na żywo.

## Gotowy post do grup

> Dzień dobry! Mam na imię Mateusz, mieszkam w Lginiu. Prowadzę indywidualne korepetycje z matematyki od 4 klasy
> do matury, online albo na miejscu w okolicy Wschowy (od 45 zł za 45 minut). Na pierwszą lekcję wystarczy jedno
> zadanie z zeszytu, z którym jest kłopot: rozrysujemy je razem krok po kroku. Na stronie można wypróbować przykładowe zadanie z ułamków
> i zaproponować termin: https://pachulski.dev/korepetycje/

## Zasada

Nie wpisywać na stronę ani do danych strukturalnych opinii, których nie ma; opinie z programowania są podpisane
jako opinie z programowania i linkują do źródła.

## Zakres (22 listopada 2026)

Mateusz: „dlaczego nie liceum?”. Decyzja: **od 4 klasy do matury, online i na miejscu.** Rynek (raport
`_tutoring-review-2026-11-21.md`): we Wschowie jedyna konkurencja uczy klasy 4–8 i maturę za 90 zł/h, tylko na
miejscu; matura podstawowa w regionie kosztuje 60–100 zł/h. Cena 60 zł / 45 min (80 zł/h) jest w środku rynku.
Zasada: nie pisać o wynikach matur ani zdawalności, dopóki nie ma uczniów po egzaminie; opisywać tylko sposób pracy.
Do ustalenia: lekcje na miejscu u Mateusza czy dojazd do ucznia (promień, koszt dojazdu).
