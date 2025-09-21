# Aktienpreis Website

Eine moderne Oberfläche im Apple-Stil, um Aktienkurse abzurufen und lokal zu
speichern. Die Anwendung stellt eine Express-API bereit, die jede Abfrage in
SQLite sichert und auf Wunsch wieder ausliefert.

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
- Gib im Suchfeld das gewünschte Symbol (z. B. `AAPL` oder `MSFT`) ein und
  bestätige.
- Der Server lädt den aktuellen Kurs von Yahoo Finance, speichert ihn in der
  lokalen SQLite-Datenbank und zeigt die Historie der gespeicherten Werte an.
- Über den Button rechts oben lässt sich zwischen Light- und Dark-Mode wechseln.
- Die statischen Dateien liegen im Ordner `public/` und werden von Express
  ausgeliefert.

## API-Endpoints
- `GET /api/quote?symbol=AAPL` – lädt den aktuellen Kurs, legt ihn in der
  Datenbank ab und liefert den letzten Stand sowie bis zu 20 gespeicherte Werte.
- `GET /api/history?symbol=AAPL` – gibt bis zu 100 gespeicherte Kurswerte zurück.

## Hinweis zur Datenquelle
Die Kursdaten werden live von Yahoo Finance bezogen. Bei sehr vielen Abfragen
kann der externe Dienst Rate Limits setzen.
