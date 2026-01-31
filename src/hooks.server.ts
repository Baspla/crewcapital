import { sequence } from '@sveltejs/kit/hooks';
import cron from 'node-cron';
import { handle as authHandle, proxyAuthHandle } from '$lib/server/auth';
import { building } from '$app/environment';
import { fetchHistoricalData, fetchQuoteSummary, fetchStockQuote } from '$lib/server/yahoo/finance';
import { ensureBaseCurrencies } from '$lib/server/db/actions';

// Combine Auth.js handle with proxy auth middleware
export const handle = sequence(authHandle, proxyAuthHandle);

if (!building) {
  ensureBaseCurrencies().catch((err) => {
    console.error('Error ensuring base currencies:', err);
  });
  cron.schedule('*/15 * * * *', async () => {
    console.log('Fetching market data...');
    try {

    } catch (err) {
      console.error('Task failed:', err);
    }
  });
}