# Aktienpreis Website

Eine moderne Oberfläche im Apple-Stil, die lokal gespeicherte Aktienkurse
anzeigt. Die Anwendung stellt eine Express-API bereit, mit der du eigene
Kursdaten in SQLite ablegst und anschließend abrufst.

## Voraussetzungen
- [Node.js](https://nodejs.org/) (Version 18 oder neuer)
- npm

## Installation & Start
1. Abhängigkeiten installieren:
   ```bash
   npm install
   ```
2. Server starten:
   ```bash
   npm start
   ```
3. Im Browser `http://localhost:3000` öffnen. Die Datenbank-Datei wird beim
   ersten Start unter `data/stocks.db` angelegt.

## Bedienung
- Lege zunächst Kursdaten über die API an (siehe unten).
- Gib im Suchfeld das gewünschte Symbol (z. B. `AAPL` oder `MSFT`) ein und
  bestätige.
- Der Server liefert den zuletzt gespeicherten Kurs aus der lokalen Datenbank
  inklusive Historie.
- Über den Button rechts oben lässt sich zwischen Light- und Dark-Mode wechseln.
- Die statischen Dateien liegen im Ordner `public/` und werden von Express
  ausgeliefert.

## Kurse hinzufügen
Die Anwendung ruft keine externen Quellen mehr ab. Du entscheidest selbst,
welche Werte gespeichert werden sollen. Verwende dafür den Endpoint
`POST /api/prices` und übergib die Kursdaten als JSON:

```bash
curl -X POST http://localhost:3000/api/prices \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","price":189.32,"currency":"USD"}'
```

- `symbol` wird automatisch in Großbuchstaben gespeichert.
- `price` erwartet eine Zahl.
- `currency` ist optional; ohne Angabe bleibt das Feld leer.
- Optional kannst du `fetchedAt` setzen (ISO-8601-Format oder Datumsangaben,
  die `new Date()` versteht), z. B. `"2024-04-01T15:30:00Z"`. Ohne Angabe wird
  der aktuelle Zeitpunkt gespeichert.

Alternativ kannst du die Datenbank direkt mit `sqlite3 data/stocks.db`
bearbeiten und eigene Datensätze in die Tabelle `prices` einfügen.

## API-Endpoints
- `POST /api/prices` – speichert einen Kurswert.
- `GET /api/quote?symbol=AAPL` – liefert den letzten gespeicherten Kurs sowie
  bis zu 20 historische Werte.
- `GET /api/history?symbol=AAPL` – gibt bis zu 100 gespeicherte Kurswerte zurück.

## Beispiel-Testdaten
Im Ordner `data/` liegt die Datei [`test-prices.json`](data/test-prices.json) mit
mehreren Kursen für AAPL, MSFT, TSLA, SAP und Adidas. Damit kannst du die
Oberfläche ohne eigenen Datenbestand ausprobieren.

### Laden per Skript
1. Starte den Server (`npm start`).
2. Importiere die Beispieldaten in einem zweiten Terminal:

   ```bash
   node scripts/import-prices.js
   ```

   Der Import verwendet standardmäßig `data/test-prices.json` und sendet jeden
   Eintrag an `http://localhost:3000/api/prices`.

Optional kannst du eine andere Datei oder Basis-URL übergeben:

```bash
node scripts/import-prices.js path/zur/datei.json http://localhost:4000
```

Das Skript prüft jedes Objekt und bricht bei Fehlern mit einer verständlichen
Fehlermeldung ab.
