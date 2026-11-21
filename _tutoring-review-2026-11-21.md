# Strona korepetycji oczami rodzica: przegląd i teksty do wklejenia

Strona: https://pachulski.dev/korepetycje/ (plik `korepetycje/index.html`, w repo niczego nie zmieniałem).
Zrzuty ekranu w tym folderze: `phone-fold.png`, `phone-full.png` (Pixel 7), `desktop-fold.png`, `desktop-full.png` (1280 px).
Data: 21.11.2026.

## Ocena po 10 sekundach (jako rodzic piątoklasisty spod Wschowy)

| Pytanie | Czy strona odpowiada? |
|---|---|
| Co dostanę? | **Częściowo.** Widzę „Matematyka dla klas 4–6” i obietnicę „jedno zadanie z zeszytu”. Słowo „korepetycje” nie pada w żadnym widocznym nagłówku. „Online” jest tylko w małym, szarym podpisie pod nazwiskiem („Lgiń · lekcje online”). Rodzic ze Wschowy domyślnie zakłada, że korepetytor przychodzi do domu, a ten szczegół łatwo przeoczyć. |
| Za ile? | **Tak, i to wyraźnie.** „45 zł / 45 minut · indywidualnie”. To najmocniejszy element strony. |
| Od kogo? | **Tak.** Zdjęcie, imię i nazwisko, Lgiń. Brakuje tylko tego, czy Mateusz uczył już dzieci w tym wieku. |
| Jak zacząć? | **Tak, ale tylko e-mailem.** Rodzice ze wsi i małych miast częściej dzwonią albo piszą SMS. Nie wiem też, co się dzieje po wysłaniu e-maila. |
| Czy ufam (dziecko 10–12 lat, online)? | **Jeszcze nie do końca.** Nie wiem, na jakim programie są lekcje, czy muszę siedzieć obok, czy jest kamera, czy mogę najpierw porozmawiać z Mateuszem. Opinie są uczciwie podpisane jako opinie z programowania, ale opinii z matematyki nie ma. |

**Co działa:** strona brzmi po ludzku. Ma konkret na start („jedno zadanie z zeszytu”), cenę na samej górze, prawdziwą opinię ze źródłem i przykład z ułamkami, który pokazuje sposób tłumaczenia. Ten przykład wyróżnia stronę na tle całej konkurencji z OLX, która tylko opisuje swoje zajęcia.

**Co zniechęca:**
1. Nie wiadomo, jak wygląda lekcja online: na jakim programie, czy potrzebna jest kamera i czy rodzic ma być obok.
2. Jedyny kontakt to e-mail. Nie ma telefonu ani SMS-a.
3. Nie ma ani słowa o pierwszej lekcji na próbę, o płatności i odwoływaniu zajęć.
4. Link „Przeczytaj opinie na e-korepetycje.net” prowadzi do profilu, na którym jest tylko **informatyka za 140 zł / 60 min**. Na tej stronie lekcje programowania kosztują 100 zł / 60 min, a matematyki na profilu nie ma wcale. Rodzic, który kliknie, będzie zdezorientowany. Trzeba dopisać matematykę na profilu (jest to w TUTORING.md, pkt 2) i ujednolicić cenę informatyki.
5. Kreator terminu pisze „czasu polskiego” i ma etykietę „Godzina w Polsce”. Dla rodzica z Lginia to dziwne, bo brzmi jak oferta dla kogoś z zagranicy.

---

## 1) Top 5 zmian o największym wpływie na liczbę wiadomości

Wszystkie zmiany dotyczą tylko tekstu w istniejących elementach. Układ, kolory i czcionki zostają.

### Zmiana 1: w pierwszym widoku słowa „korepetycje” i „online” (H1 + lead)
Rodzic przegląda stronę, szukając słów „korepetycje” i „gdzie”. Dziś „online” ginie w szarym podpisie.

- H1, było: `Matematyka dla klas 4–6`
- H1, propozycja: **`Korepetycje z matematyki online dla klas 4–6`**
  (Na telefonie to 3 linie zamiast 2. Jeśli ma zostać krótko: `Matematyka online, klasy 4–6`.)
- Lead, propozycja (ten sam akapit, jedno zdanie więcej na początku):
  > **Lekcje przez internet, jeden na jeden, z domu.** Na pierwszą lekcję wystarczy jedno zadanie z zeszytu. Poproszę dziecko, żeby pokazało mi miejsce, w którym utknęło, i rozrysujemy ten krok razem.

### Zmiana 2: e-mail od rodzica ma się pisać sam (treść `mailto` przycisku głównego)
Dziś do wiadomości wstawia się tylko „Jakie terminy są wolne?”, więc potrzebna jest druga wymiana maili. Proponuję gotowy szablon w `body=` (zakodowany jak obecny):

> Dzień dobry,
> szukam korepetycji z matematyki online.
> Klasa dziecka:
> Z czym jest kłopot (np. ułamki, zadania tekstowe):
> Pasujące dni i godziny:
> Telefon (jeśli woli Pan zadzwonić):
> Pozdrawiam

Tekst pod przyciskiem, było: „Jeśli poczta się nie otworzy, skopiuj adres i napisz ze swojej skrzynki. Wystarczy podać klasę dziecka.”
Propozycja:
> Wystarczy napisać, do której klasy chodzi dziecko i z czym ma kłopot. Odpisuję zwykle **[FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: np. „tego samego dnia wieczorem”]**. Jeśli poczta się nie otworzy, skopiuj adres.

### Zmiana 3: telefon lub SMS obok e-maila
To najprostszy sposób na więcej kontaktów od rodziców w regionie. W każdym lokalnym ogłoszeniu z OLX (Wschowa, Głogów, Leszno) jest telefon, a kilka wprost zachęca do SMS-a. Jeśli Mateusz się zgodzi, w linii z adresem:
> m.pachulski94@gmail.com · **SMS lub telefon: [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: numer]** (najlepiej po **[godzina]**)

Wygląd się nie zmienia: to ten sam akapit `.direct`, a numer jest linkiem `tel:` w stylu „Kopiuj adres”.

### Zmiana 4: jedno zdanie o pierwszej lekcji i zaufaniu pod ceną
Linia z ceną zostaje bez zmian. Pod nią (albo jako druga linia `.offer`) dodajemy rekomendację z sekcji 5:
> **Pierwsze 20 minut za darmo:** poznajemy się, sprawdzamy połączenie i robimy razem jedno zadanie. Rodzic może być obok. **[DECYZJA MATEUSZA: forma lekcji próbnej, patrz sekcja 5]**

### Zmiana 5: odpowiedzi na pytania rodzica (mini-sekcja „Jak wygląda lekcja” i mini-FAQ, patrz sekcja 2)
Najlepiej jako kolejny `<details>` w tym samym stylu co „Zobacz, jak tłumaczę dodawanie ułamków”: zero zmian wizualnych, jeden wiersz więcej na liście. Summary: **„Jak wygląda lekcja online i ile kosztuje?”**

Do tego poprawka spójności: na profilu e-korepetycje.net dopisać matematykę i wyrównać cenę informatyki (140 zł tam, 100 zł tutaj). To nie jest tekst strony, ale link z opiniami prowadzi właśnie tam.

---

## 2) Pytania rodzica bez odpowiedzi i proponowane teksty

**Pytania bez odpowiedzi:**
1. Na jakim programie są lekcje (Zoom, Google Meet, Teams, Skype)? Czy muszę coś instalować?
2. Czego dziecko potrzebuje: komputer czy tablet, kamera, słuchawki, zeszyt?
3. Czy muszę być obok? Czy mogę zajrzeć albo posłuchać?
4. Czy jest lekcja próbna? Czy pierwsza lekcja jest płatna?
5. W jakie dni i o jakich godzinach? Czy po 15:00, czy w weekendy?
6. Jak płacę: przelew, BLIK, przed czy po lekcji?
7. Co, jeśli dziecko zachoruje, czyli jak odwołać lekcję?
8. Czy dostanę informację, co było na lekcji i nad czym pracować?
9. Czy pan uczył już dzieci w tym wieku? Ile ma pan lat? (wystarczy jedno zdanie o doświadczeniu)
10. Czy pomaga pan też przed sprawdzianem albo z pracą domową? Czy klasa 7–8 też?
11. Czy wystawia pan rachunek?

### Mini-sekcja „Jak wygląda lekcja” (do wklejenia jako `<details>`)

**Summary:** Jak wygląda lekcja online?

> 1. **Przed lekcją** wysyłasz mi zdjęcie zadania albo tematu, z którym jest kłopot (może być z telefonu).
> 2. **Łączymy się przez [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: Google Meet / Zoom / Teams]**. Wystarczy komputer albo tablet z kamerą i mikrofonem, a link wysyłam e-mailem lub SMS-em.
> 3. **Na lekcji** dziecko pokazuje zeszyt do kamery, a ja rysuję na wspólnej tablicy **[FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: jakiej, np. tablet + tablica w Meet]**. Zadanie dziecko rozwiązuje samo, ja podpowiadam krok po kroku.
> 4. **Po lekcji** wysyłam rodzicowi krótką notkę: co robiliśmy i jedno–dwa zadania do domu. **[FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: czy na pewno tak, w jakiej formie: SMS / e-mail]**
>
> Rodzic może siedzieć obok przez całą lekcję albo zajrzeć na początku. Jak wolicie.

### Mini-FAQ (do wklejenia jako `<details>` lub pod sekcją wyżej)

> **Czy pierwsza lekcja jest płatna?**
> [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA, rekomendacja w sekcji 5:] Pierwsze 20 minut jest bezpłatne. Poznajemy się, sprawdzamy połączenie i robimy jedno zadanie. Dalej umawiamy się tylko wtedy, jeśli dziecku pasuje.
>
> **Kiedy są lekcje?**
> [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: np. „Od poniedziałku do piątku po 16:00, w soboty rano.”]
>
> **Jak się płaci?**
> [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: np. „Przelewem lub BLIK-iem po lekcji.”] 45 zł za 45 minut, bez pakietów i bez umowy na miesiące.
>
> **A jeśli dziecko zachoruje?**
> [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: np. „Wystarczy dać znać do [godzina] dnia przed lekcją, wtedy nic nie płacicie.”]
>
> **Z czym mogę przyjść?**
> Z bieżącym materiałem z klas 4–6: ułamki, działania pisemne, zadania tekstowe, pola i obwody, przygotowanie do sprawdzianu. [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: czy klasy 7–8 / egzamin ósmoklasisty też]
>
> **Jak szybko pan odpisze?**
> [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: np. „Zwykle tego samego dnia.”]
>
> **Notka dla rodzica**
> [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: czy i jak wysyła informację po lekcji]

W notce „Kto prowadzi zajęcia?” brakuje jednego faktu, o który pyta każdy rodzic: **[FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: czy uczył już dzieci w wieku 10–12 lat (np. rodzeństwo, sąsiedzi, wolontariat), w jakim wieku byli uczniowie z programowania]**. Nie wpisywać, jeśli nie ma takiego faktu.

---

## 3) Nagłówki, przyciski, akapity: ocena i ludzkie wersje

| Element | Ocena | Propozycja |
|---|---|---|
| Nav „Przykład z lekcji” | OK, ale przy przewijaniu na telefonie to jedyny link. | Bez zmian albo „Jak tłumaczę”. |
| „Lgiń · lekcje online” | Ważna informacja w najmniejszym druku. | Bez zmian, jeśli „online” trafi do H1 (zmiana 1). |
| H1 „Matematyka dla klas 4–6” | Ładne, ale bez „korepetycji” i „online”. | „Korepetycje z matematyki online dla klas 4–6”. |
| Lead | Najlepszy tekst na stronie, konkretny i ludzki. Trzy krótkie zdania brzmią trochę jak lista. | „…Poproszę dziecko, żeby pokazało mi miejsce, w którym utknęło, i rozrysujemy ten krok razem.” (dwa zdania złączone przecinkiem) |
| „45 zł / 45 minut · indywidualnie” | Bardzo dobre. | Bez zmian. |
| Przycisk „Zapytaj e-mailem o termin” | Jasny. „E-mailem” odstrasza rodzica, który chce zadzwonić, ale to uczciwe. | Bez zmian. Jeśli pojawi się telefon: „Napisz w sprawie terminu”. |
| „Jeśli poczta się nie otworzy, skopiuj adres i napisz ze swojej skrzynki.” | Techniczne, brzmi jak instrukcja obsługi. | „Wystarczy napisać, w której klasie jest dziecko i z czym ma kłopot. Jeśli poczta się nie otworzy, skopiuj adres.” |
| „Kto prowadzi zajęcia?” | Dobre pytanie rodzica. | Bez zmian. |
| „Na matematyce też lubię rysować.” | „Też” jest niejasne (też, czyli jak na programowaniu?). | „Na matematyce dużo rysuję: przy ułamkach zaczynamy od dwóch pasków papieru.” |
| „skończyłem studia inżynierskie w Groningen” | OK, prawdziwe. Rodzic może nie wiedzieć, gdzie to jest. | „…studia inżynierskie w Groningen (Holandia)”. Tylko jeśli Mateusz chce. |
| „Opinie po lekcjach programowania” | Uczciwe, i tak ma zostać. | Bez zmian. Można dołożyć zdanie z tej samej, prawdziwej opinii: „Mateusz potrafi wytłumaczyć zagmatwany kod w zrozumiały sposób.” To pokazuje umiejętność tłumaczenia, a słowo „kod” zostawia jasne, że to programowanie. |
| „Zobacz, jak tłumaczę dodawanie ułamków” | Bardzo dobre, to wyróżnik. | Bez zmian. |
| „Oba paski mają tę samą długość. W każdym policz zamalowane części.” | Dobre, mówi do dziecka. | Bez zmian. |
| „Wolisz zaproponować konkretny termin?” | OK. | Bez zmian. |
| Eyebrow „Kontakt” + „Kiedy Ci pasuje?” | OK. | Bez zmian. |
| „Wybierz dogodny dzień i godzinę. Kalendarz pomoże Ci przygotować e-mail. Potwierdzę termin w odpowiedzi.” | **Brzmi sztucznie** („dogodny”, „kalendarz pomoże Ci przygotować”, czyli język aplikacji). | „Kliknij dzień i godzinę, a ja przygotuję z tego e-mail. Odpiszę, czy termin jest wolny.” |
| Etykieta „Godzina w Polsce” | Dziwna dla rodzica z okolicy. | „Godzina”. |
| „Co chcesz przećwiczyć? (opcjonalnie)” | OK, ale pisze rodzic. | „Z czym jest kłopot? (nie trzeba)”. |
| Przycisk „Przygotuj wiadomość” | OK. | Bez zmian. |
| Treść generowanego maila: „…interesują mnie zajęcia online (matematyka, klasy 4–6, 45 zł / 45 min). Czy termin … o … czasu polskiego jest wolny?” | Nawias z ceną i „czasu polskiego” brzmią jak formularz. | „Dzień dobry, szukam korepetycji z matematyki dla dziecka z klasy __. Czy pasowałby [dzień] o [godzina]? Temat: …” |
| „Uczysz się programowania?” | Na stronie dla rodzica odciąga uwagę, ale jest zwinięte na dole, więc nie przeszkadza. | Bez zmian. |
| `og:description` „Indywidualne korepetycje z matematyki. Mateusz Pachulski, Lgiń koło Wschowy.” | Bez „online” w podglądzie na FB. | „Online, jeden na jeden, 45 zł za 45 minut. Mateusz Pachulski z Lginia koło Wschowy.” |

**Ogólnie:** strona *nie* brzmi jak AI ani jak marketing. Nie ma „pasji”, „indywidualnego podejścia” ani wykrzykników. Sztucznie brzmią tylko teksty pomocnicze kalendarza i podpowiedzi techniczne. Formy zwracania się: lead mówi o dziecku w 3. osobie, kalendarz mówi „Ci”. Rodzice w regionie są przyzwyczajeni do „Pan/Państwo” albo do bezosobowego „wystarczy…”. Proponuję tam, gdzie to łatwe, formy bezosobowe zamiast „Ty”.

---

## 4) Czego uczą ogłoszenia konkurencji

| Ogłoszenie | Cena | Co przekonuje / czego brakuje |
|---|---|---|
| [Wschowa: „Korepetycje z matematyki z pasją i doświadczeniem”](https://www.olx.pl/d/oferta/korepetycje-z-matematyki-z-pasja-i-doswiadczeniem-CID4371-ID1cVzWC.html) | 90 zł/h, tylko stacjonarnie | „Ponad 30-letni staż”, ciepły ton, „cierpliwe tłumaczenie”. **Telefon i prośba o SMS „Matematyka – korepetycje”, oddzwoni.** Brak lekcji próbnej i online. To bezpośrednia konkurencja: Mateusz jest tańszy i online, ale ona ma staż i telefon. |
| [Głogów: „Korepetycje z Matematyki I SP • E8 • Liceum”](https://www.olx.pl/d/oferta/korepetycje-z-matematyki-i-sp-e8-liceum-CID4371-ID1cz0aE.html) | 55 zł / 60 min (SP) | Opis metody: „rozwiązujemy zadania krok po kroku”, „pracujemy nad błędami”, notatki i zadania po lekcji. Konkretne wyniki E8 (92–98%). |
| [Głogów: „stacjonarnie lub zdalnie”](https://www.olx.pl/d/oferta/korepetycje-matematyka-glogow-stacjonarnie-lub-zdalnie-CID4371-ID1bGEzS.html) | 50 zł / 60 min | **Jedyne, które nazywa platformę (Zoom).** Pomoc z pracą domową między lekcjami, „Wierzę, że matematykę da się polubić”. Tylko weekendy. |
| [Głogów: KORKAMI, „OSTATNIE WOLNE MIEJSCA”](https://www.olx.pl/d/oferta/korepetycje-matematyka-angielski-polski-chemia-fizyka-biologia-matura-8-klasa-ostatenie-wolne-miejsca-CID4371-IDQzY2I.html) | 1. lekcja 79 zł, potem 100 zł / 60 min | Osobna cena pierwszej lekcji, prośba „podaj przedmiot, klasę, preferowane dni” (gotowy szablon zapytania), opinie na Facebooku. Presja („ostatnie miejsca”). |
| [Leszno: „MATEMATYKA ONLINE”](https://www.olx.pl/d/oferta/korepetycje-matematyka-online-leszno-CID4371-ID183sAk.html) | 80 zł/h (SP) | **„Pierwsza lekcja próbna z RABATEM -50%”**, lista okolicznych wsi (łapie wyszukiwania lokalne), telefon, „oddzwonimy po 17:30”, notatki po lekcji. Ton krzykliwy (wersaliki, wykrzykniki). |
| [Leszno: „szkoła podstawowa”](https://www.olx.pl/d/oferta/korepetycje-matematyka-szkola-podstawowa-CID4371-ID1dcQsE.html) | 100 zł/h | Tylko „absolwent Politechniki Wrocławskiej”. Krótko i sucho. Pokazuje, że minimum treści też się ogłasza. |
| [Głogów: „Korepetycje z matematyki”](https://www.olx.pl/d/oferta/korepetycje-z-matematyki-CID4371-ID1cW1DT.html) | 50 zł / 60 min | Ton „Cześć!”, zaproszenie do SMS-a. |
| [Głogów: „Korepetycje Matematyka Głogów”](https://www.olx.pl/d/oferta/korepetycje-matematyka-glogow-CID4371-IDVuKaY.html) | 50 zł w tytule, 100 zł indywidualnie | Antyprzykład: niespójna cena podważa zaufanie. To samo grozi Mateuszowi przez rozbieżność 100 i 140 zł na e-korepetycje. |
| [Łódź: „DOJAZD LUB ONLINE. Terminy na jutro!”](https://olx.pl/d/oferta/korepetycje-matematyka-dojazd-do-domu-lub-online-terminy-na-jutro-CID4371-ID17gNAC.html) | 89–99 zł / 60 min | „Pierwsze zajęcia są zawsze w najtańszym wariancie”, a w tytule „terminy na jutro”, czyli szybki start. |
| [Szczecin: „klasy 1–7”](https://www.olx.pl/845006734) | 70 zł / 60 min | „Przed rozpoczęciem współpracy rozmawiam z rodzicem”, czyli rozmowa z rodzicem jako pierwszy krok. |
| [e-korepetycje.net: profil Mateusza](https://www.e-korepetycje.net/tronk12) | informatyka 140 zł / 60 min | 6 opinii, 5,0. Matematyki brak. Pełna opinia Michaliny zawiera też „Mateusz potrafi wytłumaczyć zagmatwany kod w zrozumiały sposób” oraz „Zajęcia są prowadzone w miłej atmosferze”. |
| [Preply (platforma online)](https://preply.com/pl/korepetytor/3648731) | lekcje 50-min | Bezpłatne lekcje próbne jako standard platformy („Masz jeszcze 2 bezpłatne lekcje próbne”). |

**Wnioski:**
1. **Telefon lub SMS** to standard w regionie. Każde lokalne ogłoszenie go ma.
2. **Opis lekcji online prawie nikt nie podaje** (platformę nazwało tylko 1 z 12). Krótka sekcja „Jak wygląda lekcja” od razu wyróżni Mateusza.
3. **Nikt nie pokazuje przykładu tłumaczenia.** Zadanie z ułamkami jest unikalne i warto je mocniej podkreślić w postach do grup.
4. **Zadania i notatki po lekcji** to częsta obietnica, a opinia Michaliny potwierdza ją u Mateusza, więc warto ją powtórzyć w opisie lekcji (jeśli tak faktycznie będzie).
5. **Ceny:** 45 zł / 45 min to ok. 60 zł/h, czyli dolna połowa regionu. Można to podkreślić bez krzyku.
6. **Ton:** spokojny ton Mateusza wypada wiarygodniej niż „OSTATNIE WOLNE MIEJSCA” i wersaliki. Tego nie zmieniać.

---

## 5) Rynek lekcji próbnych i cen

**Próbka:** 12 ogłoszeń korepetycji z matematyki obejmujących szkołę podstawową (8 z regionu Wschowa/Głogów/Leszno, 4 online/inne miasta, OLX, stan na 21.11.2026) plus profil na Preply. Dla porównania: wyszukiwarka pokazała też fragment ogłoszenia OLX z „Lekcja zapoznawcza (0 zł): Pierwsze spotkanie jest całkowicie darmowe! Poznajemy się, sprawdzamy poziom i ustalamy plan działania” (80 zł/h), ale [ogłoszenie](https://www.olx.pl/d/oferta/korepetycje-z-matematyki-kazdy-poziom-CID4371-ID1ar0kA.html) zostało już zdjęte (HTTP 410), więc nie liczę go do statystyk.

### Jak często i w jakiej formie jest lekcja próbna
| Forma | Ile ogłoszeń (z 12) | Przykład i opis |
|---|---|---|
| Brak wzmianki o próbie | **9** | Wschowa, 4× Głogów, Leszno SP, Piekary/Lubin, 2× Warszawa |
| Pierwsza lekcja za pół ceny | 1 | Leszno ONLINE: „Pierwsza lekcja próbna z RABATEM -50%” (bez czasu i kwoty) |
| Pierwsza lekcja taniej | 1 | Głogów KORKAMI: „Pierwsza lekcja: 79 zł”, potem 100 zł / 60 min |
| Pierwsza lekcja w najniższej stawce pakietowej | 1 | Łódź: „Pierwsze zajęcia są zawsze w najtańszym wariancie!” |
| Rozmowa z rodzicem przed startem (bez lekcji) | +1 (Szczecin, spoza głównej dwunastki) | „Przed rozpoczęciem współpracy rozmawiam z rodzicem…” |
| Bezpłatna lekcja próbna | 0 aktywnych na OLX; standard na Preply | Preply: „Masz jeszcze 2 bezpłatne lekcje próbne” (lekcje 50-min) |

**Wniosek:** w regionie **nikt nie oferuje bezpłatnej próby**, a 3 z 12 ogłoszeń dają zniżkę na pierwszą lekcję. Sformułowanie „bez zobowiązań” nie padło ani razu.

### Typowe ceny
- **Za 60 minut (SP):** 50–100 zł. W regionie: 50, 50, 55, 80, 90, 100, 100 (100 to stawka regularna KORKAMI) → **mediana ok. 80–85 zł**. Online z innych miast: 45–99 zł.
- **Za 45 minut:** w próbce **nikt nie podaje lekcji 45-minutowych** (60 min to norma, Preply ma 50 min). W przeliczeniu stawki regionu to **ok. 38–75 zł za 45 min**, mediana ok. 60 zł.
- **Mateusz: 45 zł / 45 min = 60 zł/h**, czyli dolna połowa rynku, porównywalnie z tańszymi ofertami z Głogowa (50–55 zł/h).

### Rekomendacja: JEDNA forma
**Bezpłatne pierwsze 20 minut online (zapoznanie i jedno zadanie z zeszytu), rodzic może być obok.**

Uzasadnienie:
1. **Zdejmuje największy lęk rodzica przy lekcji online z 10-latkiem:** czy połączenie zadziała, czy dziecko się dogada, kim jest ten pan. 20 minut wystarczy, żeby to sprawdzić, a lekcja zniżkowa za 22,50 zł nadal wymaga płatności i decyzji z góry.
2. **Wyróżnia w regionie:** nikt lokalnie nie daje bezpłatnej próby, a zniżki −50% i −21% mają już inni.
3. **Pasuje do obecnej obietnicy** („na pierwszą lekcję wystarczy jedno zadanie z zeszytu”). Próba to po prostu ten pierwszy krok, nie nowy produkt.
4. **Koszt dla Mateusza jest mały** (20 min, bez dojazdów) i nie psuje ceny 45 zł, która zostaje stała i prosta. Pełna darmowa lekcja 45 min przyciągałaby jednorazowych „łowców” przed sprawdzianem.
5. Daje naturalne domknięcie: na koniec 20 minut od razu ustala się pierwszy płatny termin.

**Gotowe zdanie na stronę** (pod ceną, ta sama klasa `.offer`/akapit, bez zmiany wyglądu). **Wymaga decyzji Mateusza przed publikacją:**
> **Pierwsze 20 minut za darmo:** poznajemy się, sprawdzamy połączenie i rozwiązujemy razem jedno zadanie z zeszytu. Rodzic może być obok. Dalej umawiamy się tylko, jeśli dziecku to pasuje.

Wersja do posta w grupach / OLX:
> Pierwsze 20 minut jest bezpłatne: wystarczy jedno zadanie z zeszytu, z którym dziecko ma kłopot.

Jeśli Mateusz zdecyduje się na ofertę próbną, trzeba ją dopisać też w danych strukturalnych (`offers`) i w poście w TUTORING.md. Bez jego zgody nie wpisywać, bo zasada „nie wymyślamy faktów” obejmuje także warunki oferty.

---

## 6) Czy zostać przy klasach 4–6?

### Co mówią dane
**Popyt ogólnie.** Według CBOS korepetycje i kursy przygotowawcze opłaca w roku 2025/2026 **34% rodzin z dziećmi w wieku szkolnym**. To rekord (rok wcześniej 29%, w 2015 r. 14%) ([CBOS, Komunikat 107/2025](https://www.cbos.pl/PL/publikacje/raporty/open_file.php?id=7105), tabela 4). Komunikat nie dzieli tego na poziomy klas, więc twardych danych „ile procent w klasach 4–6 vs 7–8 vs liceum” nie znalazłem. Interia podaje, że w 2027 r. do matury przystąpi rekordowe 386 tys. uczniów, a rodzice zapisują dzieci na korepetycje już w lipcu ([Interia](https://biznes.interia.pl/finanse/news-ruszyly-zapisy-na-korepetycje-na-wrzesien-w-wielu-miejscach,nId,23510873)).

**Na czym skupia się konkurencja w regionie.** Przejrzałem tytuły 53 ogłoszeń matematyki z OLX w promieniu Głogów/Leszno/Wschowa ([lista Głogów i okolice](https://www.olx.pl/uslugi/korepetycje/matematyka/glogow/), [lista Leszno i okolice](https://www.olx.pl/uslugi/korepetycje/matematyka/leszno/)):
- **20 z 53 (ok. 38%)** ma w tytule egzamin ósmoklasisty (E8) i/lub maturę. Ogłoszeniodawcy uważają, że tam są pieniądze, ale tam jest też największy tłok, w tym firmy z kilkunastoma kopiami ogłoszenia (EduKing, KORKAMI, „MATEMATYKA ONLINE” w każdym mieście).
- **Tylko 1 tytuł** celuje wprost w szkołę podstawową ([Leszno, 100 zł/h, stacjonarnie](https://www.olx.pl/d/oferta/korepetycje-matematyka-szkola-podstawowa-CID4371-ID1dcQsE.html)). **Żaden** nie mówi o klasach 4–6. Ta nisza jest praktycznie pusta.
- **We Wschowie jest jedno ogłoszenie** z matematyki: klasy 4–8 i matura, 90 zł/h, tylko stacjonarnie ([OLX](https://www.olx.pl/d/oferta/korepetycje-z-matematyki-z-pasja-i-doswiadczeniem-CID4371-ID1cVzWC.html)). Online lokalnie nie oferuje nikt.

**Ceny w regionie za 60 min** (z ogłoszeń, które podają stawki na kilka poziomów):

| Poziom | Głogów, prywatny ([OLX](https://www.olx.pl/d/oferta/korepetycje-z-matematyki-i-sp-e8-liceum-CID4371-ID1cz0aE.html)) | EduKing ([OLX](https://olx.pl/d/oferta/korepetycje-matematyka-stacjonarnie-lub-online-e8-matura-CID4371-ID1diPB2.html)) | „MATEMATYKA ONLINE” Leszno ([OLX](https://www.olx.pl/d/oferta/korepetycje-matematyka-online-leszno-CID4371-ID183sAk.html)) | KORKAMI Głogów ([OLX](https://www.olx.pl/d/oferta/korepetycje-matematyka-angielski-polski-chemia-fizyka-biologia-matura-8-klasa-ostatenie-wolne-miejsca-CID4371-IDQzY2I.html)) |
|---|---|---|---|---|
| SP (w tym E8) | 55 zł | 60 zł | 80 zł | 100 zł |
| Matura podstawowa | 60 zł | 65 zł | 90 zł | 100 zł |
| Matura rozszerzona | 65 zł | 70 zł | 100 zł | 130 zł |

Wniosek: E8 zwykle kosztuje tyle co reszta SP. Matura podstawowa to +5–10 zł/h, rozszerzona +10–30 zł/h.

**Kiedy rośnie popyt** (wnioski z ogłoszeń i artykułów, bez twardych danych miesięcznych):
- **wrzesień–październik**: start roku i zapisy, część rodziców rezerwuje już w lipcu ([Interia](https://biznes.interia.pl/finanse/news-ruszyly-zapisy-na-korepetycje-na-wrzesien-w-wielu-miejscach,nId,23510873));
- **grudzień–styczeń**: koniec I semestru, ratowanie ocen (dotyczy wszystkich klas, w tym 4–6);
- **luty–maj**: E8 i matura odbywają się w maju, więc ósmoklasiści i maturzyści szukają najintensywniej wiosną;
- **czerwiec**: oceny końcoworoczne; **sierpień**: poprawki.
- Dziś jest 21 listopada, czyli **zaczyna się okres przed końcem semestru**. To dobry moment na klasy 4–6 i 7.

### Rekomendacja: **klasy 4–8, z egzaminem ósmoklasisty jako drugą linią. Matury na razie nie.**

| Zakres | Decyzja | Cena | Uzasadnienie |
|---|---|---|---|
| Klasy 4–6 | **Zostaje jako główna oferta** (nagłówek, przykład z ułamkami) | **45 zł / 45 min** bez zmian | Pusta nisza w regionie, idealnie pasuje do „zadania z zeszytu” i rysowania. Dla 10–12-latka 45 minut online to dobra długość. |
| Klasy 7–8 + egzamin ósmoklasisty | **Dodać** jednym zdaniem i w FAQ | **50 zł / 45 min** (≈67 zł/h, poniżej mediany regionu ok. 80 zł/h) albo te same 45 zł dla prostoty | To ci sami rodzice, czyli rodzeństwo i dzieci, które „rosną” z korepetytorem. Ostatni rok przed egzaminem to najsilniejsza motywacja do płacenia. Materiał jest bez trudu w zasięgu inżyniera. Zakres „4–8” to też standard w regionie (Wschowa: „klasy 4–8”). |
| Matura podstawowa | **Nie teraz.** Ewentualnie od lata 2027, po pierwszych opiniach z matematyki | Gdyby: **60 zł / 45 min** lub 75 zł / 60 min | Największy tłok (firmy, studenci, nauczyciele z wynikami). Decyzję podejmuje nastolatek, a nie rodzic, więc potrzebny jest inny przekaz. Strona dla rodzica 10-latka nie przekona maturzysty. |
| Matura rozszerzona | **Nie** | — | Klienci wymagają udokumentowanych wyników. Mateusz ich w matematyce nie ma, a nie wolno ich wymyślać. |

**Gotowe teksty (bez zmiany wyglądu):**
- H1: `Korepetycje z matematyki online dla klas 4–6` zostaje. Główny przekaz się nie rozmywa.
- Linia oferty, druga pozycja (jeśli Mateusz się zgodzi): **„Klasy 7–8 i przygotowanie do egzaminu ósmoklasisty: [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: 50 zł] / 45 minut.”**
- FAQ: **„Czy uczy pan też starsze dzieci?** Tak, klasy 7–8, także przed egzaminem ósmoklasisty. Pracujemy na zadaniach z zeszytu i na arkuszach z poprzednich lat.” [FAKT DO UZUPEŁNIENIA PRZEZ MATEUSZA: potwierdzić, że chce i będzie pracował na arkuszach CKE]
- `<title>`/opis i dane strukturalne: dopisać „klasy 7–8, egzamin ósmoklasisty” dopiero po decyzji.

### Dlaczego taki kompromis
- **Szybkość pierwszych uczniów:** 4–6 to nisza bez konkurencji, a 7–8 to segment z najsilniejszą motywacją. Razem dają szerszą bazę tych samych rodziców (grupy szkół podstawowych na Facebooku, tablica w szkole w Lginiu) bez budowania drugiej strony.
- **Profil Mateusza:** inżynier i programista z doświadczeniem w korepetycjach dobrze wypada przy „tłumaczę krok po kroku” i rysowaniu. Przy maturze konkuruje z nauczycielami, którzy podają „98% zdawalności”, a on nie ma czym na to odpowiedzieć.
- **Online z małej miejscowości:** online pozwala zbierać uczniów z Wschowy, Sławy i Góry jednocześnie, a tam stacjonarny konkurent bierze 90 zł/h.

### Ryzyka
1. **Rozmycie wiarygodności:** strona „od wszystkiego” wygląda jak ogłoszenie firmy. Dlatego klasy 4–6 zostają w nagłówku, a 7–8 dochodzą jedną linią.
2. **Obietnice egzaminacyjne:** nie pisać o wynikach ani o „skutecznym przygotowaniu”, dopóki nie ma żadnego ucznia po E8. Opisywać tylko sposób pracy.
3. **Przygotowanie Mateusza:** E8 wymaga znajomości formatu arkuszy CKE. Zanim się to ogłosi, warto przerobić 2–3 arkusze.
4. **Spójność:** cena 7–8 musi być taka sama na stronie, w danych strukturalnych, w poście w TUTORING.md, na OLX i na e-korepetycje.net. Niespójna cena to najczęstszy błąd konkurencji, który podważa zaufanie (patrz [Głogów: 50 zł w tytule, 100 zł w treści](https://www.olx.pl/d/oferta/korepetycje-matematyka-glogow-CID4371-IDVuKaY.html)).
5. **Brak twardych danych o popycie według klas:** rekomendacja opiera się na strukturze ogłoszeń (podaż) i ogólnych danych CBOS, a nie na badaniu popytu w poszczególnych klasach. Po 4–6 tygodniach warto sprawdzić, z jakich klas faktycznie piszą rodzice.
