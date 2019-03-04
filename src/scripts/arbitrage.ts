/* 
yarn build && node dist/index.js arbitrage

TODO:
- wait for Veil API to support market orders
- send push notification for filled orders using Twilio API
 */
import { IMarketMakerParams } from "../MarketMaker";

const BREAK_EVEN_PRICE = 0.98;
const PRICE_CONVERSION = 10000.0;
const AMOUNT_CONVERSION = 100000000000000;

export default async (params: IMarketMakerParams) => {
  const { market, veil, side } = params;

  const asks = await veil.getAsks(market, side);
  for (let ask of asks.results) {
    const price = Number(ask.price) / PRICE_CONVERSION;
    if (price >= BREAK_EVEN_PRICE) {
      continue;
    }
    
    const amount = Number(ask.tokenAmount) / AMOUNT_CONVERSION;
    const quote = await veil.createQuote(
      market,
      "buy",
      side,
      amount,
      price
    );
    const order = await veil.createOrder(quote, { postOnly: true });
    console.log("Created order", order);
  }
};
