import { sequence } from '@sveltejs/kit/hooks';
import cron from 'node-cron';
import { handle as authHandle, proxyAuthHandle } from '$lib/server/auth';
import { building } from '$app/environment';
import { assertBaseCurrencies, assertAssetCategories, assertCurrencyConversions } from '$lib/server/db/actions';
import { updateMarketData } from '$lib/server/finance/financeUtils';
// Combine Auth.js handle with proxy auth middleware
export const handle = sequence(authHandle, proxyAuthHandle);

if (!building) {
  assertBaseCurrencies().catch((err) => {
    console.error('Error asserting base currencies:', err);
  });
  assertAssetCategories().catch((err) => {
    console.error('Error asserting asset categories:', err);
  });
  assertCurrencyConversions().catch((err) => {
    console.error('Error asserting currency conversions:', err);
  });
  cron.schedule('*/15 * * * *', async () => {
    updateMarketData().then(() => {
      console.log('Market data updated successfully.');
    }).catch((err) => {
      console.error('Error updating market data:', err);
    })
  });
  cron.schedule('0 0 * * *', async () => {
    console.log('Daily maintenance task running...');
    // Add any daily maintenance tasks here
    // Clean up old data, optimize DB, etc.
  });
}