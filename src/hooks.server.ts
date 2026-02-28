import cron from 'node-cron';
import { auth } from "$lib/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";

import { building } from '$app/environment';
import { assertBaseCurrencies, assertAssetCategories, assertCurrencyConversions } from '$lib/server/services/bootstrap';
import { updateMarketData } from '$lib/server/services/market-data';

if (!building) {
  await assertBaseCurrencies().catch((err) => {
    console.error('Error asserting base currencies:', err);
  });
  await assertAssetCategories().catch((err) => {
    console.error('Error asserting asset categories:', err);
  });
  await assertCurrencyConversions().catch((err) => {
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

export async function handle({ event, resolve }) {
const session = await auth.api.getSession({
headers: event.request.headers,
});

if (session) {
event.locals.session = session.session;
event.locals.user = session.user;
}

return svelteKitHandler({ event, resolve, auth, building });
}
