/*
yarn build && node dist/index.js best-price will-u-s-presidential-candidate-pete-buttigieg-have-one-million-or-more-twitter-followers-on-may-1-2019-82977aaa --amount 1 --side sell --type short
*/

import { IMarketMakerParams, cancelAllOrders } from "../MarketMaker";
import Veil, { Market } from "veil-js";

const BREAK_EVEN_PRICE = 0.98;
const PRICE_CONVERSION = 10000.0;
const PRICE_INCREMENT = 0.0001;
const AMOUNT_CONVERSION = 100000000000000;
const MIN_AMOUNT = 0.1;

let myPrice = -1;

export default async (params: IMarketMakerParams) => {
  const { market, veil, amount, side, type } = params;

  const orders = side === "buy" ? (await veil.getBids(market, type)).results :
      (await veil.getAsks(market, type)).results;
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const bestPrice = Number(order.price) / PRICE_CONVERSION;
    const bestAmount = Number(order.tokenAmount) / AMOUNT_CONVERSION;

    if (bestPrice === myPrice) {
      const nextOrder = orders[i+1];
      const nextPrice = Number(nextOrder.price) / PRICE_CONVERSION;
      if (side === "buy" && myPrice !== nextPrice + PRICE_INCREMENT) {
        await newOrder(veil, market, amount, side, type, nextPrice + PRICE_INCREMENT);
      } else if (side === "sell" && myPrice !== nextPrice - PRICE_INCREMENT) {
        await newOrder(veil, market, amount, side, type, nextPrice - PRICE_INCREMENT);
      }
      break;
    } else if (bestAmount >= MIN_AMOUNT && bestPrice !== myPrice) {
      if (side === "buy") {
        await newOrder(veil, market, amount, side, type, bestPrice + PRICE_INCREMENT);
      } else {
        await newOrder(veil, market, amount, side, type, bestPrice - PRICE_INCREMENT);
      }
      break;
    }
  }
};

const newOrder = async (veil: Veil, market: Market, amount: number, side: "buy" | "sell",
    type: "long" | "short", price: number) => {
  if (price >= BREAK_EVEN_PRICE) {
    return;
  }
  
  const quote = await veil.createQuote(
    market,
    side,
    type,
    amount,
    price
  );
  await cancelAllOrders(veil, market);
  const order = await veil.createOrder(quote, { postOnly: true });
  console.log("Created order", order);
  myPrice = price;
}
