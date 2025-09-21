#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const [, , fileArg, serverArg] = process.argv;
const defaultFile = path.join(__dirname, '..', 'data', 'test-prices.json');
const filePath = fileArg ? path.resolve(process.cwd(), fileArg) : defaultFile;
const baseUrl = (serverArg || 'http://localhost:3000').replace(/\/$/, '');

async function postPrice(entry, index) {
  const response = await fetch(`${baseUrl}/api/prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Fehler beim Import des Eintrags #${index + 1} (${entry.symbol || 'unbekannt'}): ${
        response.status
      } ${response.statusText}\n${text}`
    );
  }

  const data = await response.json();
  console.log(
    `Gespeichert: ${data.entry.symbol} zu ${data.entry.price} ${
      data.entry.currency || ''
    } (Zeitstempel: ${data.entry.fetchedAt || 'jetzt'})`
  );
}

async function main() {
  let raw;
  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Datei konnte nicht gelesen werden: ${filePath}`);
    console.error(error.message);
    process.exit(1);
  }

  let entries;
  try {
    entries = JSON.parse(raw);
  } catch (error) {
    console.error('JSON konnte nicht geparst werden. Stelle sicher, dass die Datei ein Array enthält.');
    console.error(error.message);
    process.exit(1);
  }

  if (!Array.isArray(entries)) {
    console.error('Erwartet ein Array von Kursobjekten.');
    process.exit(1);
  }

  if (entries.length === 0) {
    console.log('Keine Einträge zu importieren.');
    return;
  }

  for (const [index, entry] of entries.entries()) {
    if (typeof entry !== 'object' || entry === null) {
      console.warn(`Eintrag #${index + 1} wird übersprungen: Kein Objekt.`);
      continue;
    }

    if (typeof entry.symbol !== 'string' || !entry.symbol.trim()) {
      console.warn(`Eintrag #${index + 1} wird übersprungen: Symbol fehlt.`);
      continue;
    }

    if (!Number.isFinite(entry.price)) {
      console.warn(`Eintrag #${index + 1} wird übersprungen: Preis ist ungültig.`);
      continue;
    }

    const payload = {
      symbol: entry.symbol,
      price: entry.price,
    };

    if (entry.currency) {
      payload.currency = entry.currency;
    }
    if (entry.fetchedAt) {
      payload.fetchedAt = entry.fetchedAt;
    }

    try {
      await postPrice(payload, index);
    } catch (error) {
      console.error(error.message);
      process.exit(1);
    }
  }

  console.log('Import abgeschlossen.');
}

main().catch((error) => {
  console.error('Unerwarteter Fehler:', error);
  process.exit(1);
});
