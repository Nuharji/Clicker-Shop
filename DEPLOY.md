# Deployment-Anleitung (Schritt für Schritt)

Diese App merkt sich Accounts und Bestellungen dauerhaft in einer kleinen
Datenbank. Deshalb reicht kein reines "statisches Hosting" – du brauchst
einen Anbieter, der die App laufen lässt **und** die Datenbank dauerhaft
speichert.

Es gibt zwei Wege, das zu lösen:

- **Variante A (unten, Standard): Render.com mit bezahltem Disk.**
  Einfacher einzurichten, kostet aber ca. 7 $/Monat, weil ein
  persistenter Disk nur ab dem "Starter"-Plan verfügbar ist.
- **Variante B: Render.com (kostenloser Plan) + Turso (kostenlose
  externe Datenbank).** Etwas mehr Einrichtungsaufwand (ein
  zusätzlicher Account bei Turso), dafür komplett kostenlos – siehe
  Abschnitt [**"Kostenlose Variante mit Turso"**](#kostenlose-variante-mit-turso)
  weiter unten. Der App-Code funktioniert mit beiden Varianten identisch,
  du musst nur andere Umgebungsvariablen setzen (Schritt 4).

## Schritt 1: Code auf GitHub hochladen

1. Erstelle (falls noch nicht vorhanden) einen kostenlosen Account auf
   [github.com](https://github.com).
2. Klicke oben rechts auf **+** → **New repository**. Name z. B.
   `dumpling-clicker`, Sichtbarkeit "Private" ist ok. Erstellen.
3. Auf der leeren Repo-Seite auf **uploading an existing file** klicken.
4. Ziehe den kompletten Inhalt dieses Projektordners hinein (außer den
   Ordnern `node_modules`, `.next` und `data`, falls vorhanden – die
   werden nicht gebraucht) und bestätige den Upload ("Commit changes").

## Schritt 2: Render-Account + Web Service

1. Gehe auf [render.com](https://render.com) und erstelle einen
   kostenlosen Account (Login mit GitHub geht am schnellsten).
2. Klicke auf **New +** → **Web Service**.
3. Wähle dein gerade hochgeladenes GitHub-Repo aus.
4. Einstellungen:
   - **Name**: z. B. `dumpling-clicker`
   - **Region**: eine europäische Region (z. B. Frankfurt)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: den günstigsten Plan wählen, der **einen Disk
     erlaubt** (aktuell "Starter"). Der kostenlose Plan geht technisch,
     aber ohne Disk gehen bei jedem Neustart alle Bestellungen/Accounts
     verloren.

## Schritt 3: Persistenten Speicher (Disk) hinzufügen

1. Im Service unter **Disks** → **Add Disk**.
2. **Mount Path**: `/data`
3. Größe reicht 1 GB locker.

## Schritt 4: Umgebungsvariablen setzen

Im Service unter **Environment**:

| Name | Wert |
|---|---|
| `SESSION_SECRET` | ein langer zufälliger Text (z. B. per [random.org](https://www.random.org/strings/) erzeugen, mind. 32 Zeichen) |
| `DB_PATH` | `/data/app.db` |

Speichern – Render baut die App jetzt automatisch. Das dauert ein paar
Minuten.

## Schritt 5: Admin-Account anlegen

Nach dem ersten erfolgreichen Deploy: im Service oben auf **Shell**
klicken (öffnet ein Terminal direkt auf dem Server) und eingeben:

```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=DeinPasswort node scripts/seed.js
```

(Passwort natürlich durch ein echtes, sicheres Passwort ersetzen.) Das
legt deinen Admin-Zugang an und – falls noch keine Produkte existieren –
ein Beispielprodukt, das du danach im Admin-Bereich bearbeiten oder
löschen kannst.

## Fertig

Deine Website ist jetzt unter der von Render angezeigten Adresse
erreichbar (etwas wie `https://dumpling-clicker.onrender.com`). Diese
Adresse kannst du im Internat teilen. Über **Login → Admin** kommst du
mit dem oben angelegten Account in den Admin-Bereich, um Produkte,
Farben und Bestellstatus zu verwalten.

### Spätere Änderungen am Code

Wenn du (oder ich für dich) später etwas am Code änderst: die neuen
Dateien wieder ins selbe GitHub-Repo hochladen (überschreiben). Render
erkennt das automatisch und baut die Seite neu – die Datenbank auf dem
Disk bleibt dabei erhalten.

### Eigene Domain (optional)

Unter **Settings → Custom Domains** kannst du später eine eigene Domain
(z. B. `dumpling-clicker.de`) mit dem Service verbinden, falls du eine
kaufen möchtest.

---

## Kostenlose Variante mit Turso

Statt einer SQLite-Datei auf einem bezahlten Render-Disk kann die App
auch eine **Turso**-Datenbank benutzen – eine kostenlose,
SQLite-kompatible Cloud-Datenbank (der Free-Plan reicht für dieses
Projekt locker aus). Damit läuft die Website komplett auf Render's
**kostenlosem** Web-Service-Plan.

Der einzige Nachteil: Render's kostenloser Plan hat kein eingebautes
**Shell**-Terminal (das gibt es erst ab dem bezahlten Plan). Deshalb
legst du den Admin-Account in dieser Variante von deinem eigenen
Rechner aus an (Schritt 5b unten) statt über eine Render-Shell.

### Schritt 1–2: wie oben

Code auf GitHub hochladen (Schritt 1) und einen **Web Service** auf
Render anlegen (Schritt 2) – aber bei **Instance Type** diesmal einfach
den kostenlosen **"Free"**-Plan auswählen (kein Starter-Plan nötig,
kein Disk nötig).

### Schritt 3 (ersetzt Schritt 3 oben): Turso-Datenbank anlegen

1. Gehe auf [turso.tech](https://turso.tech) und erstelle einen
   kostenlosen Account.
2. Lege eine neue Datenbank an (z. B. Name `dumpling-clicker`; Region
   möglichst nah an der Render-Region wählen, z. B. Frankfurt/`fra`).
3. Öffne die neu angelegte Datenbank im Turso-Dashboard. Dort findest
   du:
   - eine **Datenbank-URL** – sieht aus wie
     `libsql://dumpling-clicker-deinname.turso.io`
   - einen Button zum Erzeugen eines **Auth-Tokens** ("Create Token"
     o. ä.) – ein langer zufälliger Text.
   Beides brauchst du im nächsten Schritt.

### Schritt 4 (ersetzt Schritt 4 oben): Umgebungsvariablen setzen

Im Render-Service unter **Environment**:

| Name | Wert |
|---|---|
| `SESSION_SECRET` | ein langer zufälliger Text (z. B. per [random.org](https://www.random.org/strings/) erzeugen, mind. 32 Zeichen) |
| `DATABASE_URL` | die Turso-Datenbank-URL aus Schritt 3, z. B. `libsql://dumpling-clicker-deinname.turso.io` |
| `DATABASE_AUTH_TOKEN` | das Turso-Auth-Token aus Schritt 3 |

`DB_PATH` wird in dieser Variante **nicht** gesetzt – sobald
`DATABASE_URL` vorhanden ist, benutzt die App automatisch die
Turso-Datenbank statt einer lokalen Datei.

Speichern – Render baut die App jetzt automatisch.

### Schritt 5b (ersetzt Schritt 5 oben): Admin-Account anlegen (von deinem Rechner aus)

Weil der kostenlose Render-Plan keine Shell hat, führst du das
Seed-Skript einmalig lokal aus, aber mit den Turso-Zugangsdaten aus
Schritt 3 – dann landet der Admin-Account direkt in der Cloud-Datenbank,
die auch deine Render-App benutzt.

Voraussetzung: [Node.js](https://nodejs.org) ist auf deinem Rechner
installiert und du hast den Projektordner (denselben, den du auf GitHub
hochgeladen hast) lokal liegen.

Im Projektordner, in einem Terminal:

```bash
npm install
DATABASE_URL="libsql://dumpling-clicker-deinname.turso.io" \
DATABASE_AUTH_TOKEN="dein-turso-token" \
ADMIN_USERNAME=admin ADMIN_PASSWORD=DeinPasswort \
node scripts/seed.js
```

(Die drei Werte durch deine echten aus Schritt 3 bzw. ein sicheres
Passwort ersetzen.) Das legt den Admin-Zugang und – falls noch keine
Produkte existieren – ein Beispielprodukt direkt in der Turso-Datenbank
an. Das Skript kannst du jederzeit erneut mit denselben Werten laufen
lassen, ohne etwas kaputt zu machen (es überspringt einfach, was schon
existiert).

### Fertig (Turso-Variante)

Deine Website ist jetzt kostenlos unter der von Render angezeigten
Adresse erreichbar. Login/Admin-Bereich, Produkte, Bestellungen usw.
funktionieren genau wie in Variante A – der einzige Unterschied ist, wo
die Daten gespeichert werden.

Ein Hinweis zum kostenlosen Render-Plan: er "schläft" nach einer Weile
Inaktivität ein und braucht dann beim nächsten Aufruf ein paar Sekunden
zum Aufwachen. Das ist für eine interne Bestellseite meist kein
Problem, aber gut zu wissen, falls die Seite beim ersten Klick kurz
lädt.
