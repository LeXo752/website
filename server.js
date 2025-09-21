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

app.use(express.static(PUBLIC_DIR));

app.get('/', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

    res.status(400).json({ error: 'Symbol erforderlich.' });
    return;
  }

    const historyRows = await all(
      `SELECT symbol, price, currency, fetched_at
         FROM prices
        WHERE symbol = ?
        ORDER BY datetime(fetched_at) DESC
        LIMIT 20`,
      [symbol]
    );


      history: historyRows.map((row) => ({
        symbol: row.symbol,
        price: row.price,
        currency: row.currency,
        fetchedAt: row.fetched_at,
      })),
    });
  } catch (error) {
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
