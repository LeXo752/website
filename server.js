const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const DB_PATH = path.join(DATA_DIR, 'stocks.db');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  db.run(
    `CREATE INDEX IF NOT EXISTS idx_prices_symbol
       ON prices(symbol)`
  );
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });

app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.post('/api/prices', async (req, res) => {
  const body = req.body || {};
  const rawSymbol = typeof body.symbol === 'string' ? body.symbol.trim() : '';
  const rawCurrency = typeof body.currency === 'string' ? body.currency.trim() : '';
  const symbol = rawSymbol.toUpperCase();

  if (!symbol) {
    res.status(400).json({ error: 'Symbol erforderlich.' });
    return;
  }

  const price = Number(body.price);
  if (!Number.isFinite(price)) {
    res.status(400).json({ error: 'Preis muss eine Zahl sein.' });
    return;
  }

  let timestamp = null;
  if (body.fetchedAt) {
    const parsed = new Date(body.fetchedAt);
    if (Number.isNaN(parsed.getTime())) {
      res.status(400).json({ error: 'fetchedAt ist kein gültiges Datum.' });
      return;
    }
    timestamp = parsed.toISOString();
  }

  const currency = rawCurrency ? rawCurrency.toUpperCase() : null;

  try {
    const params = timestamp
      ? [symbol, price, currency, timestamp]
      : [symbol, price, currency];
    const placeholders = timestamp
      ? '(symbol, price, currency, fetched_at) VALUES (?, ?, ?, ?)' 
      : '(symbol, price, currency) VALUES (?, ?, ?)';

    const result = await run(
      `INSERT INTO prices ${placeholders}`,
      params
    );

    const rows = await all(
      `SELECT id, symbol, price, currency, fetched_at
         FROM prices
        WHERE id = ?`,
      [result.lastID]
    );

    const entry = rows[0];

    res.status(201).json({
      message: 'Kurs gespeichert.',
      entry: entry && {
        id: entry.id,
        symbol: entry.symbol,
        price: entry.price,
        currency: entry.currency,
        fetchedAt: entry.fetched_at,
      },
    });
  } catch (error) {
    console.error('Fehler beim Speichern des Kurses:', error);
    res.status(500).json({ error: 'Kurs konnte nicht gespeichert werden.' });
  }
});

app.get('/api/quote', async (req, res) => {
  const rawSymbol = (req.query.symbol || '').trim();
  if (!rawSymbol) {
    res.status(400).json({ error: 'Symbol erforderlich.' });
    return;
  }

  const symbol = rawSymbol.toUpperCase();

  try {
    const historyRows = await all(
      `SELECT symbol, price, currency, fetched_at
         FROM prices
        WHERE symbol = ?
        ORDER BY datetime(fetched_at) DESC
        LIMIT 20`,
      [symbol]
    );

    if (!historyRows.length) {
      res.status(404).json({ error: `Für ${symbol} wurden noch keine Kurse gespeichert.` });
      return;
    }

    const latest = historyRows[0];

    res.json({
      symbol,
      price: latest.price,
      currency: latest.currency,
      fetchedAt: latest.fetched_at,
      history: historyRows.map((row) => ({
        symbol: row.symbol,
        price: row.price,
        currency: row.currency,
        fetchedAt: row.fetched_at,
      })),
    });
  } catch (error) {
    console.error('Fehler beim Laden des Kurswerts:', error);
    res.status(500).json({ error: 'Datenbankfehler beim Laden des Kurswerts.' });
  }
});

app.get('/api/history', async (req, res) => {
  const rawSymbol = (req.query.symbol || '').trim();
  if (!rawSymbol) {
    res.status(400).json({ error: 'Symbol erforderlich.' });
    return;
  }

  const symbol = rawSymbol.toUpperCase();

  try {
    const rows = await all(
      `SELECT symbol, price, currency, fetched_at
         FROM prices
        WHERE symbol = ?
        ORDER BY datetime(fetched_at) DESC
        LIMIT 100`,
      [symbol]
    );

    res.json({
      symbol,
      history: rows.map((row) => ({
        symbol: row.symbol,
        price: row.price,
        currency: row.currency,
        fetchedAt: row.fetched_at,
      })),
    });
  } catch (error) {
    console.error('Fehler beim Laden der Historie:', error);
    res.status(500).json({ error: 'Datenbankfehler beim Laden der Historie.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server läuft unter http://localhost:${PORT}`);
});

const shutdown = () => {
  console.log('\nBeende Server und schließe Datenbank...');
  db.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
