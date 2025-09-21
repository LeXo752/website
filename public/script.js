document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('stock-form');
  const resultDiv = document.getElementById('result');
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

  const dateFormatter = new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const parseTimestamp = (value) => {
    if (!value) return null;
    const normalized = value.includes('T') ? value : value.replace(' ', 'T') + 'Z';
    const parsed = Date.parse(normalized);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  };

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    themeToggle.textContent = next === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('theme', next);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const symbol = document.getElementById('symbol').value.trim().toUpperCase();
    if (!symbol) return;
    resultDiv.innerHTML = '<p class="loading">Lade...</p>';
    try {
      const response = await fetch(`/api/quote?symbol=${encodeURIComponent(symbol)}`);
      let payload;
      if (response.headers.get('content-type')?.includes('application/json')) {
        payload = await response.json();
      }
      if (!response.ok) {
        const message = payload?.error || 'Fehler beim Abrufen.';
        throw new Error(message);
      }
      if (!payload) {
        throw new Error('Unerwartete Antwort vom Server.');
      }
      const data = payload;
      const currency = data.currency || 'USD';
      const numberFormatter = new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency,
      });
      const formattedPrice =
        typeof data.price === 'number' ? numberFormatter.format(data.price) : data.price;
      const latestDate = parseTimestamp(data.fetchedAt);
      const history = Array.isArray(data.history) ? data.history : [];
      const historyList = history
        .map((entry) => {
          const time = parseTimestamp(entry.fetchedAt);
          const priceText =
            typeof entry.price === 'number'
              ? numberFormatter.format(entry.price)
              : `${entry.price}`;
          const timeText = time ? dateFormatter.format(time) : entry.fetchedAt;
          return `<li><span>${timeText}</span><span>${priceText}</span></li>`;
        })
        .join('');

      resultDiv.innerHTML = `
        <div class="result-card">
          <div class="result-header">
            <h2>${data.symbol}</h2>
            <span class="price">${formattedPrice}</span>
          </div>
          <p class="timestamp">Letzte Aktualisierung: ${
            latestDate ? dateFormatter.format(latestDate) : 'unbekannt'
          }</p>
          <h3>Gespeicherte Kurse</h3>
          ${
            history.length
              ? `<ul class="history-list">${historyList}</ul>`
              : '<p class="history-empty">Noch keine gespeicherten Kurse.</p>'
          }
        </div>
      `;
    } catch (err) {
      console.error(err);
      resultDiv.innerHTML = `<p class="error">${err.message || 'Fehler beim Abrufen.'}</p>`;
    }
  });
});
