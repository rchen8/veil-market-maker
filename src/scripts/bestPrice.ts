/*
yarn build && node dist/index.js best-price will-grin-usd-be-listed-on-coinmarketcap-by-march-16-2019 --amount 1 --side long
*/
import { IMarketMakerParams, cancelAllOrders } from "../MarketMaker";
import Veil, { Market } from "veil-js";

const PRICE_CONVERSION = 10000.0;
const PRICE_INCREMENT = 0.0001;
const AMOUNT_CONVERSION = 100000000000000;
const MIN_AMOUNT = 0.1;

let myPrice = -1;

export default async (params: IMarketMakerParams) => {
  const { market, veil, amount, side } = params;

  const bids = (await veil.getBids(market, side)).results;
  for (let i = 0; i < bids.length; i++) {
    const bid = bids[i];
    const bestPrice = Number(bid.price) / PRICE_CONVERSION;
    const bestAmount = Number(bid.tokenAmount) / AMOUNT_CONVERSION;

    if (bestPrice === myPrice) {
      const nextBid = bids[i+1];
      const nextPrice = Number(nextBid.price) / PRICE_CONVERSION;
      if (myPrice !== nextPrice + PRICE_INCREMENT) {
        await newOrder(veil, market, amount, side, nextPrice + PRICE_INCREMENT);
      }
      break;
    } else if (bestAmount >= MIN_AMOUNT && bestPrice !== myPrice) {
      await newOrder(veil, market, amount, side, bestPrice + PRICE_INCREMENT);
      break;
    }
  }
};

const newOrder = async (veil: Veil, market: Market, amount: number, side: "long" | "short",
    price: number) => {
  if (price >= 0.98) {
    return;
  }
  
  const quote = await veil.createQuote(
    market,
    "buy",
    side,
    amount,
    price
  );
  await cancelAllOrders(veil, market);
  const order = await veil.createOrder(quote, { postOnly: true });
  console.log("Created order", order);
  myPrice = price;
}
