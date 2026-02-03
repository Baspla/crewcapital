import yahooFinance from 'yahoo-finance2';
import type { Quote, QuoteOptions } from 'yahoo-finance2/modules/quote';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchHistoricalData(symbol: string, period1: string, period2: string) {
    try {
        const queryOptions = { period1, period2 };
        const historicalData = await yf.chart(symbol, queryOptions);
        return historicalData;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
}

export async function fetchRealTimeData(symbol: string, fields?: string[]) {
    try {
        const options: QuoteOptions = fields ? { fields } : {};
        const combined: Quote = await yf.quoteCombine(symbol, options);
        return combined;
    } catch (error) {
        console.error('Error fetching quote combined data:', error);
        throw error;
    }
}

export async function fetchRealTimeDataNonCombined(symbols: string[], fields?: string[]) {
    try {
        const options: QuoteOptions = fields ? { fields } : {};
        const combined: Quote[] = await yf.quote(symbols, options);
        return combined;
    } catch (error) {
        console.error('Error fetching quote combined data:', error);
        throw error;
    }
}