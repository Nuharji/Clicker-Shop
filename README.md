# Dumpling Clicker – Bestell-Website

Eine kleine Web-App zum kostenlosen Bestellen von 3D-gedruckten Fidgets
("Dumpling Clicker") im Internat.

- Bewohner:innen registrieren sich mit **Name**, **Haus.Etage.Zimmer** und
  einem **Passwort**, bestellen Produkte und sehen den Status ihrer
  Bestellungen.
- Erlaubte Adressen: Haus 1–13 (Etage 1–2, Zimmer 1–4) und Haus 15–18
  (Etage 1–3, Zimmer 1–4). Andere Kombinationen lässt das Formular gar
  nicht zu. Pro Zimmer sind maximal **2 Konten** erlaubt (mit
  unterschiedlichen Namen).
- Die Shop-Übersicht zeigt Produkte erstmal nur mit Bild, Name und den
  Varianten-Farbpunkten (ohne Text). Erst auf der Produkt-Detailseite
  (anklicken) sieht man die vollen Namen der Teile/Varianten und kann
  sie in den **Warenkorb** legen.
- Es gibt einen echten **Warenkorb**: mehrere Produkte (mit ihren
  gewählten Varianten) sammeln, dann im Warenkorb (`/cart`) auf einen
  Schlag **Abholung oder Lieferung** wählen, optional eine Anmerkung
  hinzufügen und abschicken. Erst dabei werden daraus die eigentlichen
  Bestellungen.
- Ein Produkt kann aus mehreren **Teilen** bestehen (z. B. Gehäuse, Kappe,
  Clip), und für jeden Teil kannst du beliebig viele **Varianten**
  anlegen (z. B. Farben). Beim Bestellen wählt man dann für jeden Teil
  eine Variante. Das legst du direkt beim Anlegen eines Produkts fest,
  oder später jederzeit im Admin-Bereich nach – dort lassen sich
  Varianten auch **umbenennen/Farbe ändern** (Klick auf den Namen) und
  mit den Pfeilen **↑↓ neu sortieren**.
- Bestellungen sind an **Abschnitte** (Bestellzeiträume) gebunden, die du
  als Admin unter „Abschnitte“ mit Start-/Enddatum **und einem
  Credit-Guthaben pro Person** anlegst (Standard: 3). Jede Bestellung
  (jede Position im Warenkorb) verbraucht 1 Credit; ihr aktuelles
  Guthaben sehen Bewohner:innen oben in der Navigation ("💳 x/y
  Credits"). Ist gerade kein Abschnitt aktiv, kann niemand bestellen.
- Varianten können **auf Lager** sein (mit fester Stückzahl, sinkt bei
  jeder Bestellung) oder **On-Demand** (immer bestellbar, wird auf
  Anfrage produziert) – das legst du pro Variante im Admin-Bereich fest.
  Ist eine Variante ausverkauft, wird sie durchgestrichen/deaktiviert
  angezeigt; sind **alle** Varianten eines Teils ausverkauft, kann das
  ganze Produkt gerade nicht mehr bestellt werden (im Shop mit einem
  "Ausverkauft"-Badge markiert).
- Im **Admin-Bereich** (eigener Login unter „Admin“ auf der Login-Seite)
  kannst du Produkte, Teile, Varianten und Bestellabschnitte verwalten
  und den Status jeder Bestellung ändern (Neu → Wird gedruckt → Fertig →
  Abgeholt, oder Storniert).
- Eine Variante kann auch ein **Farb-Mix** aus mehreren Farben sein (im
  Admin-Bereich bei einer bestehenden Variante auf „+“ neben den
  Farbfeldern klicken, bis zu 4 Farben insgesamt). Der Punkt/Swatch wird
  dann automatisch als mehrfarbiger Kreis dargestellt statt einfarbig.
- Du kannst pro Variante optional einen **Sound** hochladen (z. B. ein
  Klick-Geräusch, max. 3 MB). Bewohner:innen sehen dann beim Bestellen
  ein 🔊-Symbol neben der Variante zum Anhören; im Admin-Bereich lässt
  sich der Sound jederzeit ersetzen oder entfernen.
- Unter **„Statistik“** im Admin-Bereich siehst du auf einen Blick die
  Gesamtzahl der Bestellungen, registrierten Nutzer:innen und belegten
  Zimmer, sowie Balkendiagramme zu Bestellungen nach Status, den
  beliebtesten Produkten und Bestellungen pro Abschnitt. Die
  beliebtesten Varianten sind dabei **nach Teil gruppiert** (z. B.
  getrennte Rankings für „Farbe“ und „Kappe“ statt einer vermischten
  Liste).
- Unter **„Alle Bestellungen“** im Admin-Bereich gibt es oben ein
  **Filterformular mit einem Dropdown pro Teil** (z. B. „Farbe“,
  „Kappe“) – so kannst du z. B. gezielt nur die Bestellungen mit
  Farbe „Schwarz“ anzeigen lassen, etwa um zu sehen, wie viel du von
  welcher Variante produzieren musst. Mehrere Filter lassen sich
  kombinieren, „Filter zurücksetzen“ zeigt wieder alle Bestellungen.

  *Hinweis:* Farb-Mix, Sound und Lagerbestand/On-Demand lassen sich beim
  **Anlegen eines neuen Teils/einer neuen Variante** an einem
  bestehenden Produkt sowie beim **Bearbeiten** einer Variante
  einstellen. Im schnellen Formular zum *Neuanlegen eines Produkts* (mit
  Teilen/Varianten auf einen Schlag) ist das bewusst nicht möglich, um
  das Formular übersichtlich zu halten – lege das Produkt dort erst mit
  einfachen Farben an und ergänze Mix/Sound/Lagerbestand danach im
  Produkt selbst.
- Oben rechts gibt es einen **Light/Dark-Toggle** (🌙/☀️), der für
  jede:n Besucher:in einzeln gespeichert wird (unabhängig von der
  Systemeinstellung) und für die ganze Seite konsistent gilt.

Gebaut mit Next.js, SQLite/libSQL (lokal eine einfache Datei, in der
Cloud wahlweise eine kostenlose externe Datenbank – siehe "Live ins
Internet stellen" unten) und Tailwind CSS.

## Lokal ausprobieren

Voraussetzung: [Node.js](https://nodejs.org) Version 20 oder neuer.

```bash
npm install
cp .env.example .env.local
# Öffne .env.local und setze SESSION_SECRET auf einen zufälligen Text,
# z. B. das Ergebnis von: openssl rand -base64 32

ADMIN_USERNAME=admin ADMIN_PASSWORD=deinPasswort node scripts/seed.js
npm run dev
```

Dann [http://localhost:3000](http://localhost:3000) öffnen. Admin-Login
unter „Login“ → Tab „Admin“ mit dem Benutzernamen/Passwort aus dem
Seed-Befehl.

## Live ins Internet stellen

Ausführliche Schritt-für-Schritt-Anleitung: siehe **`DEPLOY.md`**.

Kurzfassung: Diese App braucht ein bisschen mehr als eine reine
statische Seite, weil sie sich Accounts und Bestellungen dauerhaft
merken muss. Zwei Wege stehen zur Wahl (beide in `DEPLOY.md`
Schritt-für-Schritt erklärt, auch für Leute ohne Vorerfahrung):

- Render.com mit bezahltem Disk-Plan für eine lokale SQLite-Datei
  (einfacher, ca. 7 $/Monat), oder
- Render.com **kostenlos** + eine kostenlose externe Turso-Datenbank
  (etwas mehr Einrichtung, aber komplett gratis) – siehe Abschnitt
  „Kostenlose Variante mit Turso" in `DEPLOY.md`.

## Projektstruktur (für später, falls du/jemand Code ändern will)

```
src/lib/db.ts          Datenbank-Setup (SQLite/libSQL, legt Tabellen automatisch an)
src/lib/auth.ts         Login/Session (Cookies, Passwort-Hashing)
src/lib/address.ts       Erlaubte Haus/Etage/Zimmer-Kombinationen
src/lib/status.ts        Bestellstatus-Liste (hier neue Status hinzufügen)
src/lib/colorMix.ts      Farb-Mix-Helfer (Sanitizing, Swatch-CSS für Mix-Farben)
src/lib/periods.ts       Bestellabschnitte/Credits-Logik (Guthaben pro Person/Abschnitt)
src/lib/stock.ts         Lagerbestand-Logik (ausverkauft ja/nein)
src/lib/cart.ts          Warenkorb-Helfer (Warenkorb-Inhalte lesen)
src/app/page.tsx         Shop-Startseite
src/app/register/        Registrierung
src/app/login/           Login (Bewohner + Admin)
src/app/orders/          "Meine Bestellungen" für eingeloggte Nutzer
src/app/cart/            Warenkorb & Checkout (Abholung/Lieferung, Anmerkung)
src/app/admin/products/  Produkte, Teile & Varianten (Mix-Farben/Sound/Lager) verwalten
src/app/admin/orders/    Alle Bestellungen, Status & Liefer-/Abholart einsehen
src/app/admin/periods/   Bestellabschnitte (Start-/Enddatum, Credits pro Person) verwalten
src/app/admin/stats/     Statistik-Seite (Bestellungen, Nutzer, beliebte Varianten)
src/app/product/[id]/   Produkt-Detailseite mit vollem Bestellformular
src/app/theme-toggle.tsx Light/Dark-Umschalter (Klasse auf <html>, in localStorage gespeichert)
scripts/seed.js           Legt Admin-Account, Beispielprodukt + ersten Abschnitt an
```

## Hinweis bei einem Update von einer älteren Version

Falls du diese App schon einmal laufen hattest (ohne Abschnitte/Teile):
die Datenbank wird beim nächsten Start automatisch um die neuen Spalten/
Tabellen ergänzt, bestehende Daten bleiben erhalten. Neu ist aber, dass
**ohne einen angelegten Bestellabschnitt niemand bestellen kann** – leg
also nach dem Update kurz unter „Abschnitte“ einen mit Start-/Enddatum
an (der Seed-Befehl macht das bei einer komplett neuen Datenbank
automatisch für die ersten 30 Tage).

## Sicherheitshinweis

Das Passwort wird sicher gehasht gespeichert (nicht im Klartext). Da es
sich um ein internes Tool für ein Internat handelt, gibt es bewusst
keine E-Mail-Verifizierung – jede:r mit Zugriff auf die Seite kann sich
mit beliebigem Namen registrieren. Für den beabsichtigten Zweck (kleine,
kostenlose Bestellungen innerhalb eines Hauses) ist das ein
angemessener Kompromiss zwischen Aufwand und Sicherheit.
