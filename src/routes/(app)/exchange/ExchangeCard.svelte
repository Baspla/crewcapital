<script lang="ts">
  import { enhance } from '$app/forms';

  interface ExchangePair {
    id: string;
    fromCurrencyId: string;
    toCurrencyId: string;
    staticConversionRate: number | null;
    currentRate: number;
    fromCurrency: { symbol: string; name: string };
    toCurrency: { symbol: string; name: string };
  }

  interface PortfolioBalance {
    currencyId: string;
    amount: number;
  }

  interface Portfolio {
    id: string;
    name: string;
    currencies: PortfolioBalance[];
  }

  interface Props {
    pair: ExchangePair;
    portfolio: Portfolio | undefined;
  }

  let { pair, portfolio }: Props = $props();

  let amount = $state(0);
  let isLoading = $state(false);

  let currentRate = $derived(pair.currentRate);
  let hasRate = $derived(currentRate > 0);
  
  let sourceBalance = $derived.by(() => {
        if (!portfolio) return 0;
        const balance = portfolio.currencies.find((c) => c.currencyId === pair.fromCurrencyId);
        return balance ? balance.amount : 0;
  });

  let destinationAmount = $derived(amount * currentRate);
  
  function setMax() {
      amount = sourceBalance;
  }
</script>

<div class="card p-4 space-y-4 shadow-xl bg-surface-100-800-token" class:opacity-50={!hasRate}>
  <header class="flex justify-between items-center">
    <div>
      <h3 class="h3 flex items-center gap-2">
        <span class="font-bold">{pair.fromCurrency.symbol}</span>
        <span>→</span>
        <span class="font-bold">{pair.toCurrency.symbol}</span>
      </h3>
      {#if hasRate}
        <p class="text-sm opacity-70">Rate: 1 {pair.fromCurrency.symbol} ≈ {currentRate.toFixed(4)} {pair.toCurrency.symbol}</p>
      {:else}
        <p class="text-sm text-error-500">Rate unavailable</p>
      {/if}
    </div>
  </header>

  <form method="POST" use:enhance={() => {
      isLoading = true;
      return async ({ update }) => {
          isLoading = false;
          update();
      };
  }}>
    <input type="hidden" name="pairId" value={pair.id} />
    <input type="hidden" name="portfolioId" value={portfolio?.id} />
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <label class="label">
            <span>Cost ({pair.fromCurrency.symbol})</span>
            <div class="input-group grid-cols-[1fr_auto]">
                <input class="ig-input" type="number" step="any" name="amount" bind:value={amount} min="0" max={sourceBalance} placeholder="0.00" disabled={!hasRate} />
                <div class="ig-cell preset-tonal">{pair.fromCurrency.symbol}</div>
            </div>
            <div class="flex justify-between text-xs mt-1 opacity-70">
                <span>Balance: {sourceBalance.toFixed(2)}</span>
                <button type="button" class="anchor" onclick={setMax} disabled={!hasRate}>Max</button>
            </div>
        </label>
        
        <label class="label">
            <span>Gives ({pair.toCurrency.symbol})</span>
             <div class="input-group grid-cols-[1fr_auto]">
                <input class="ig-input" type="number" value={destinationAmount.toFixed(2)} disabled readonly />
                <div class="ig-cell preset-tonal">{pair.toCurrency.symbol}</div>
            </div>
        </label>
    </div>

    <button type="submit" class="btn variant-filled-primary w-full mt-6" disabled={isLoading || amount > sourceBalance || amount <= 0 || !portfolio || !hasRate}>
        {#if isLoading}Processing...{:else}Exchange Funds{/if}
    </button>
  </form>
</div>
