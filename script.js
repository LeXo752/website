document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('stock-form');
  const resultDiv = document.getElementById('result');
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

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
    resultDiv.textContent = 'Lade...';
    try {
      const response = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`
      );
      const data = await response.json();
      const quote = data.quoteResponse.result[0];
      if (!quote) {
        resultDiv.textContent = `Kein Ergebnis für ${symbol}.`;
        return;
      }
      const price = quote.regularMarketPrice;
      const currency = quote.currency;
      resultDiv.innerHTML = `<div class="result-card">${symbol}: ${price} ${currency}</div>`;
    } catch (err) {
      resultDiv.textContent = 'Fehler beim Abrufen.';
    }
  });
});
