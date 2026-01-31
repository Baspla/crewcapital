import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

export async function fetchStockQuote(symbol: string) {
    try {
        const quote = await yf.quote(symbol);
        return quote;
    } catch (error) {
        console.error('Error fetching stock quote:', error);
        throw error;
    }
}

export async function fetchHistoricalData(symbol: string, period1: string, period2: string) {
    try {
        const queryOptions = { period1, period2 };
        const historicalData = await yf.historical(symbol, queryOptions);
        return historicalData;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        throw error;
    }
}

export async function fetchQuoteSummary(symbol: string) {
    try {
        const summary = await yf.quoteSummary(symbol, { modules: ['price', 'summaryDetail', 'financialData'] });
        return summary;
    } catch (error) {
        console.error('Error fetching quote summary:', error);
        throw error;
    }
}