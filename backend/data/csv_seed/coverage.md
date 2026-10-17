# Pokrycie – połączone

## Płock

# Płock (gmina miasto Płock) – raport pokrycia

Stan: 2026-10-17 (Europe/Warsaw). Zakres: wyłącznie miasto Płock (gminy ościenne – osobny zestaw REG).

## Liczby rekordów

- places.csv: 165
- opening_hours.csv: 355
- predefined_routes.csv: 71
- route_stops.csv: 212
- events.csv: 125
- sources.csv: 331
- needs_verification.csv: 286

Miejsca: współrzędne 161/165, znany price_level 102/165, godziny otwarcia 59/165. Status: verified 33, partial 79, unverified 53.

Trasy: oficjalne 6, redakcyjne 65. Wydarzenia wg statusu: upcoming 114, unverified 10, ongoing 1. Zakres dat wydarzeń: 2026-10-17 – 2027-05-29.

## Miejsca, wydarzenia i trasy wg kategorii

| kategoria | miejsca (główna) | miejsca (dodatkowa) | wydarzenia | trasy |
|---|---|---|---|---|
| historia_zabytki | 26 | 19 | 0 | 5 |
| sakralne_wielokulturowosc | 11 | 2 | 0 | 5 |
| kultura_sztuka_film | 7 | 26 | 34 | 8 |
| muzyka_widowiska | 4 | 4 | 15 | 7 |
| festiwale_lokalne_swieta | 0 | 1 | 1 | 3 |
| przyroda_spacery_widoki | 12 | 5 | 0 | 4 |
| sport_aktywny_wypoczynek | 22 | 12 | 0 | 6 |
| kibicowanie_wydarzenia_sportowe | 5 | 4 | 73 | 5 |
| zabawa_gry_adrenalina | 17 | 6 | 0 | 11 |
| warsztaty_nauka_pasje | 23 | 7 | 2 | 7 |
| jedzenie_lokalne_smaki | 31 | 6 | 0 | 3 |
| rzemioslo_pamiatki_produkty | 5 | 1 | 0 | 2 |
| relaks_wypoczynek | 2 | 10 | 0 | 5 |

Wydarzenia sportowe wg dyscypliny: piłka nożna 27, piłka ręczna 26, siatkówka 13, strzelectwo sportowe 6, pływanie 1.
Wydarzenia sportowe wg płci: male 58, female 8, nieustalona 7; wg wieku: senior 53, junior_mlodszy 10, nieustalony 7, junior 3.

## Uwagi metodyczne
- Współrzędne: OSM Nominatim (1 zapytanie/s, własny User-Agent, cache; wynik akceptowany tylko z adresem w mieście Płock). Dla obiektów bez numeru domu – wyszukiwanie POI (`osm_poi`). Bez współrzędnych: Park na Zdunach, Jar Abisynia, Lasek Brzozowy (brak w OSM pod tą nazwą) i Filia nr 5 Książnicy (Pasaż Vuka Karadzica 1 – brak w OSM).
- Ceny z agregatorów (atrakcjowo.pl, termowo.pl, gastro-plock.pl, roomescape.com, cojestgrane.pl) są oznaczone w price_notes/needs_verification.
- price_max_pln = najwyższa cena normalnego biletu podstawowego (decyzja użytkownika); bilety całodniowe, rodzinne i karnety w price_notes. Nieznana cena = puste pole, nigdy 0.
- Oferty poza sezonem zostają w katalogu z tagiem `poza_sezonem` i informacją o sezonie w price_notes / season_note: Ciuchcia Tumska, lodowisko na Starym Rynku, rejsy „Marianna”, Zalew Sobótka (kąpielisko i wypożyczalnie). Zoolandia i Fun Park mają tag `sezonowe` (Zoolandia – weekendy do końca X; Fun Park – działanie po sezonie niepotwierdzone).
- Trasy: 6 oficjalnych (5 tras spacerowych z przewodnika PLOT 2026 + Koci Szlak – tylko punkt startowy) oraz ścieżki redakcyjne o nazwach przepisanych dokładnie z pliku kategorii (kopia: /workspace/plock/kategorie_zrodla.md) – tylko te, które dotyczą Płocka; przystanki to istniejące rekordy places.csv. Ścieżki typu „do wyboru” mają stops_min=1 i czas = najdłuższy przystanek. Zachowano 1 własną propozycję („Dzień meczowy…”, opis zaczyna się od „propozycja własna”); 8 pozostałych własnych tras usunięto.
- Pominięte ścieżki z pliku (dotyczą gmin regionu lub terminów jednorazowych): Śladami dawnych grodów, Małe miasta z wielką historią, Drewniane świątynie i wiejskie parafie, Nadwiślańska mozaika kultur (skansen poza Płockiem), Weekend w rytmie regionu, Rok na mazowieckiej wsi, Dolina Skrwy, Między lasami i jeziorami, Rowerem poza miasto, W siodle, Przy regionalnym stole, Festiwal smaków, Spotkaj twórcę / Na tropie dawnych przedmiotów (Jarmark Tumski – czerwiec), Dzień bez pośpiechu, Noc odkrywców (Noc Muzeów – tylko w dniu wydarzenia), Doping nad Wisłą (brak zaplanowanych biegów po 17.10).
- Wydarzenia sportowe: tylko mecze rozgrywane w Płocku (gospodarz sprawdzony w terminarzu), od 2026-10-17 do końca opublikowanych terminarzy: Ekstraklasa do 15.05.2027, III liga (Wisła II) do 29.05.2027, ORLEN Superliga do 3.04.2027, TAURON 1. Liga (KPS) do 4.04.2027, Akademia SPR do 20.02.2027. Mecze bez godziny lub z datą = pierwszy dzień kolejki mają status `unverified` albo wpis w needs_verification. gender: female/male/mixed.
- Książnica Płocka: gmach główny + 13 filii + Biblioteka dla dzieci „Chotomek” jako osobne rekordy. Strony części filii zwracały weryfikację antybotową – NIE obchodzono jej; użyto pojedynczych, spokojnych ponownych odczytów (co 8–10 s) oraz strony godzin otwarcia, która przy ponownej próbie się wczytała. Filia nr 2 i „Chotomek”: dane z listy filii / strony godzin.
- Zgodnie z decyzją użytkownika usunięto pojedyncze siłownie plenerowe / ścieżki zdrowia (skwer gier, Aleja Nowaka, Jar Rosicy, park przy Zielonej); zostają parki, skatepark i Orliki.
- Pominięto: Happy Park (Stróżewko – gm. Radzanowo), Muzeum Memów (tylko festiwalowo), SpeedShot (firma atrakcji mobilnych).

## Główne luki
- Godziny otwarcia gastronomii: sprawdzono strony własne Browaru Tumskiego i Karczmy Pod Strzechą – brak godzin w treści (strony JS / odsyłają do Facebooka i systemu zamówień); pozostałe lokale nie mają własnych stron z godzinami w źródłach PLOT. Pole puste.
- SSM Wisła Płock: to stowarzyszenie młodzieżowej PIŁKI NOŻNEJ (nie siatkówki). Strona https przekierowuje w pętli (z boxa timeout); przez WebFetch dostępne tylko harmonogramy do 26–27.09.2026 – brak opublikowanych terminów od 17.10. Juniorskie ligi MZPN (laczynaspilka.pl) wymagają JS – nieparsowane. Wisła Płock nie gra w CLJ U-17 2026/27.
- Koszykówka: Wisła Płock Basketball (hala SP 16, ul. Piasta Kołodzieja 7) – na wozkosz.pl tylko sezon 2025/26; brak terminarza 2026/27.
- Badminton: badmintonplock.pl – brak zapowiedzi turniejów w Płocku na jesień 2026 (Badminton Płock Cup odbył się 28–29.03.2026); miejsce zajęć nieustalone, więc bez rekordu.
- MLS MOSiR: tylko wyniki minionych zawodów (biegi przełajowe 8.10, Bieg Tumski 12.10) – brak przyszłego terminarza.
- Pływanie: dodano Memoriał im. P. Przyborowskiego (18.10.2026, Podolanka; godzina nieznana). Innych zawodów nie ogłoszono.
- Jutrzenka: turniej młodziczek U13 24.10 bez miejsca – pominięty; mecze seniorek 6.11/21.11/12.12 bez godziny i przeciwnika.
- Wisła II: miejsce meczów sprzeczne (boczne boisko B2 przy ORLEN Stadionie wg Transfermarkt / Stadion Miejski im. B. Szymańskiego wg weekendgoals) – bez place_id.
- Ceny: NoveKino, Fabryka Zagadek, Kraina Wrażeń, strzelnica GROT (rekreacyjnie), Zoolandia, rejsy „Marianna”, bilety Jutrzenki i KPS, koncerty POS, mecze Wisły II.


## Źródła niedostępne / zablokowane

- https://atrakcjowo.pl/miasto/plock/ – error (niedostępne (error:404))
- https://kalendarzimprez.plock.eu/event/spotkanie-piastowie-mazowieckie-znani-ale-i-zaskakujacy-przedstawiciele-dynastii/ – error (przegląd kalendarza imprez miasta)
- https://ksiaznicaplocka.pl/placowki/filie-biblioteczne/biblioteka-dla-dzieci/ – blocked (strona weryfikacji antybotowej – nie obchodzono)
- https://ksiaznicaplocka.pl/placowki/filie-biblioteczne/filia-nr-2/ – blocked (strona weryfikacji antybotowej – nie obchodzono)
- https://ksmasovia.pl/informacje-o-klubie/ – error (niedostępne (error:SSLError))
- https://pokis.pl/zajecia-warsztaty-spotkania/warsztaty/perkusyjne – error (niedostępne (error:404))
- https://rock69.pl/ – error (niedostępne (error:SSLError))
- https://ssm.wisla.plock.pl/ – error (niedostępne (error:SSLError))
- https://turystykaplock.eu/restauracje/ – error (niedostępne (error:404))
- https://tustolica.pl/bilety/wydarzenie/jutrzenka-plock_18725249 – error (niedostępne (error:404))
- https://wisla-plock.pl/rozgrywki/ii-liga-kobiet/ – error (niedostępne (error:404))
- https://wisla-plock.pl/rozgrywki/iii-liga-gr-i/ – error (niedostępne (error:404))
- https://www.helios.pl/plock – error (niedostępne (error:404))
- https://www.ksiaznicaplocka.pl/ – error (niedostępne (error:SSLError))
- https://www.novekino.pl/kina/przedwiosnie/cennik/ – error (niedostępne (error:404))
- https://www.plockagaleria.pl/pl/ – error (niedostępne (error:404))


## Okolice

# Pokrycie – okolice Płocka (bez gminy miasto Płock)

Stan na 2026-10-17. Pliki w `/workspace/plock/out_region/`.

## Liczby rekordów

| plik | rekordy |
|---|---|
| places.csv | 151 |
| opening_hours.csv | 72 |
| events.csv | 46 |
| predefined_routes.csv | 26 |
| route_stops.csv | 90 |
| sources.csv | 196 |
| needs_verification.csv | 370 |

Status weryfikacji miejsc: partial 101, unverified 24, verified 26
Źródło współrzędnych: nominatim:exact_address 51, nominatim:locality_center 89, source_page 11
Trasy: editorial 19, official 7
Wydarzenia wg statusu: ongoing 1, upcoming 38, unverified 7

## Miejsca i wydarzenia wg gminy

| gmina | miejsca | wydarzenia |
|---|---|---|
| Sierpc | 25 | 7 |
| Gostynin (miasto) | 21 | 10 |
| Brudzeń Duży | 18 | 2 |
| Gąbin | 18 | 5 |
| Łąck | 14 | 2 |
| Gostynin (gmina wiejska) | 14 | 2 |
| Stara Biała | 11 | 4 |
| Słupno | 8 | 2 |
| Bodzanów | 6 | 2 |
| Drobin | 5 | 5 |
| Bielsk | 3 | 3 |
| Staroźreby | 3 | 2 |
| Nowy Duninów | 2 | 0 |
| Słubice (pow. płocki) | 2 | 0 |
| Radzanowo | 1 | 0 |

## Miejsca wg kategorii głównej

| kategoria | miejsca | wydarzenia |
|---|---|---|
| historia_zabytki | 31 | 0 |
| sakralne_wielokulturowosc | 30 | 0 |
| kultura_sztuka_film | 3 | 0 |
| muzyka_widowiska | 5 | 10 |
| festiwale_lokalne_swieta | 0 | 2 |
| przyroda_spacery_widoki | 21 | 0 |
| sport_aktywny_wypoczynek | 28 | 0 |
| kibicowanie_wydarzenia_sportowe | 14 | 32 |
| zabawa_gry_adrenalina | 3 | 1 |
| warsztaty_nauka_pasje | 12 | 1 |
| jedzenie_lokalne_smaki | 0 | 0 |
| rzemioslo_pamiatki_produkty | 0 | 0 |
| relaks_wypoczynek | 4 | 0 |

## Czego brakuje / luki

- **Jedzenie i lokalne smaki (0 miejsc)**: nie znaleziono pewnych, czynnych miejsc gastronomii regionalnej. Restauracja „Młynarzówka” w Cierszewie jest nieczynna od 7.11.2022 (strona ośrodka). Kasztelański Festiwal Smaków i Sierpecki Smak nie mają ogłoszonych dat na 2026/27. Ścieżek „Przy regionalnym stole” i „Festiwal smaków” nie zbudowano.
- **Rzemiosło jako kategoria główna (0)**: występuje tylko jako kategoria dodatkowa (ceramika MCK/CKiSz, zagroda młynarska w Gąsewie).
- **Młodzieżowa piłka nożna** (junior, trampkarz, młodzik, orlik): brak terminarzy. mzpn.pl zwraca pustą stronę (JS), futbolowo.pl nie pokazuje meczów, pozpn.plo.pl ma tylko harmonogramy U-8 i U-10.
- **Piłka ręczna, siatkówka, strzelectwo, biegi, rajdy**: nie znaleziono wydarzeń w regionie od 17.10.2026. Rajdy rowerowe gmin (Gąbin, Pojezierze) odbywają się latem.
- **Pominięte mecze seniorów** (25): gospodarz bez potwierdzonego boiska albo adres tylko „orientacyjnie” na radarmeczy. Dotyczy: Unia Czermno, Polonia Radzanowo, Wisła Nowy Duninów, Sparta Nowe Miszewo, Orzeł Goleszyn, Zjednoczeni Bulkowo, Mazur II, Delta II, Sparta Mochowo, Skrwa Łukomie, Spójnia Mała Wieś. Lista jest w needs_verification.csv (record_id „-”).
- **Mecze bez dokładnej daty**: część meczów kolejek 7–8.11 i 14–15.11 ma tylko zakres kolejki. Mają status `unverified` i datę pierwszego dnia kolejki.
- **Godziny otwarcia**: większość kościołów, dworów, GOK-ów i ośrodków nad jeziorami ich nie ma. Pływalnia w Gostyninie ma godziny wyprowadzone z przedziałów cennika (do potwierdzenia).
- **Ceny biletów na mecze lokalne**: nieznane wszędzie, pola puste.
- **Wydarzenia gmin Stara Biała, Słupno, Brudzeń Duży, Łąck (X–XII 2026)**: nie ma zapowiedzi. Strona GOKiS Stara Biała przekierowuje na stronę gminy, a kalendarz Brudzenia obejmuje tylko imprezy letnie (już minione).
- **Rekordy z samego rejestru zabytków** (Wikipedia, status `unverified`): Bielsk, Bodzanów, Drobin, Radzanowo, Staroźreby i część obiektów w Brudzeniu. Wymagają opisu i informacji o dostępności.
- **Ośrodki nad jeziorami** (Koszelówka, Zdwórz, Miałkówek, Białe): oferta sezonowa bez cen.

## Źródła niedostępne / problematyczne

- mzpn.pl: tabele i terminarze to pusta treść (JS).
- futbolowo.pl (Mazur Gostynin): terminarze młodzieży są puste.
- www.pozpn.plo.pl/kluby.pdf: requests się nie połączył, curl tak. Lista klubów to adresy korespondencyjne, nie boiska.
- lack.naszgok.pl: timeout przez requests, odczyt przez WebFetch.
- gokis.starabiala.pl: przekierowuje na starabiala.pl.
- zamek-gostynin.eu: timeout przez requests, odczyt przez WebFetch.
- victoria.blizej24.pl (KJ Victoria Łagiewniki): błąd 500.
- startproboszczewice.pl: 404.
- Uwaga na pomyłki nazw: wyniki wyszukiwarki mieszały Gostynin z Gostyniem, a także Łąck (pow. płocki) z Łąckiem (pow. nowosądecki). gokisbiala.pl to Biała łódzka.
