/* 
yarn build && node dist/index.js arbitrage will-2020-presidential-candidate-andrew-yang-have-250-000-or-more-twitter-followers-on-april-1-2019-37458e3c --price 0.98 --side short
*/

import { IMarketMakerParams } from "../MarketMaker";

const PRICE_CONVERSION = 10000.0;
const AMOUNT_CONVERSION = 100000000000000;

export default async (params: IMarketMakerParams) => {
  const { market, veil, price, side } = params;

  const asks = await veil.getAsks(market, side);
  for (let ask of asks.results) {
    const askPrice = Number(ask.price) / PRICE_CONVERSION;
    const amount = Number(ask.tokenAmount) / AMOUNT_CONVERSION;
    if (askPrice <= price) {
      const quote = await veil.createQuote(
        market,
        "buy",
        side,
        amount,
        askPrice
      );

      const order = await veil.createOrder(quote);
      console.log("Created market buy order", order);
    }
  }
};
