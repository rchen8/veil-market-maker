/*
yarn build && node dist/index.js binary best-picture-2019-bohemian-rhapsody --amount .01

TODO:
- no existing long/short order
- ignore small orders in orderbook
- second best price moves
- partially filled orders
*/

import { IMarketMakerParams } from "../MarketMaker";
import Veil, { Market } from "veil-js";

const PRICE_CONVERSION = 10000.0;
const PRICE_INCREMENT = 0.0001;

let longBuyOrder:any = null;
let shortBuyOrder:any = null;
let longSellOrder:any = null;
let shortSellOrder:any = null;

export default async (params: IMarketMakerParams) => {
  let { veil, market, amount } = params;

  if (longBuyOrder === null && longSellOrder === null) {
    await createOrder(veil, market, "buy", "long", amount);
  }
  if (shortBuyOrder === null && shortSellOrder === null) {
    await createOrder(veil, market, "buy", "short", amount);
  }

  await checkFilledOrders(veil, market);
  await checkOutdatedOrders(veil, market, amount);
};

const checkFilledOrders = async (veil: Veil, market: Market) => {
  const filledOrders = await veil.getUserOrders(market, { status: "filled" });
  for (let order of filledOrders.results) {
    if (longBuyOrder !== null && order.uid === longBuyOrder.uid) {
      await createOrder(veil, market, "sell", "long", Number(longBuyOrder.tokenAmountClean));
      longBuyOrder = null;
    } else if (shortBuyOrder !== null && order.uid === shortBuyOrder.uid) {
      await createOrder(veil, market, "sell", "short", Number(shortBuyOrder.tokenAmountClean));
      shortBuyOrder = null;
    } else if (longSellOrder !== null && order.uid === longSellOrder.uid) {
      longSellOrder = null;
    } else if (shortSellOrder !== null && order.uid === shortSellOrder.uid) {
      shortSellOrder = null;
    }
  }
}

const checkOutdatedOrders = async (veil: Veil, market: Market, amount: number) => {
  const bidPrice = Number((await veil.getBids(market, "long")).results[0].price);
  if (longBuyOrder !== null && bidPrice !== Number(longBuyOrder.price)) {
    await veil.cancelOrder(longBuyOrder.uid);
    console.log("Cancelled order", longBuyOrder);
    await createOrder(veil, market, "buy", "long", amount);
  }
  if (shortSellOrder !== null && bidPrice !== PRICE_CONVERSION - Number(shortSellOrder.price)) {
    await veil.cancelOrder(shortSellOrder.uid);
    console.log("Cancelled order", shortSellOrder);
    await createOrder(veil, market, "sell", "short", Number(shortSellOrder.tokenAmountClean));
  }

  const askPrice = Number((await veil.getBids(market, "short")).results[0].price);
  if (shortBuyOrder !== null && askPrice !== Number(shortBuyOrder.price)) {
    await veil.cancelOrder(shortBuyOrder.uid);
    console.log("Cancelled order", shortBuyOrder);
    await createOrder(veil, market, "buy", "short", amount);
  }
  if (longSellOrder !== null && askPrice !== PRICE_CONVERSION - Number(longSellOrder.price)) {
    await veil.cancelOrder(longSellOrder.uid);
    console.log("Cancelled order", longSellOrder);
    await createOrder(veil, market, "sell", "long", Number(longSellOrder.tokenAmountClean));
  }
}

const createOrder = async (veil: Veil, market: Market, side: "buy" | "sell",
    tokenType: "long" | "short", amount: number) => {
  let price = -1;
  if (side === "buy") {
    price = Number((await veil.getBids(market, tokenType)).results[0].price) / PRICE_CONVERSION;
    if (!(await isMyOrder(veil, market, tokenType, price))) {
      price += PRICE_INCREMENT;
    }
  } else {
    price = Number((await veil.getAsks(market, tokenType)).results[0].price) / PRICE_CONVERSION;
    if (!(await isMyOrder(veil, market, tokenType, price))) {
      price -= PRICE_INCREMENT;
    }
  }

  const quote = await veil.createQuote(
    market,
    side,
    tokenType,
    amount,
    price
  );
  const order = await veil.createOrder(quote, { postOnly: true });
  console.log("Created", tokenType, side, "order", order);

  if (side === "buy") {
    if (tokenType === "long") {
      longBuyOrder = order;
    } else {
      shortBuyOrder = order;
    }
  } else {
    if (tokenType === "long") {
      longSellOrder = order;
    } else {
      shortSellOrder = order;
    }
  }
}

const isMyOrder = async (veil: Veil, market: Market, tokenType: "long" | "short",
    price: number) => {
  const orders = await veil.getUserOrders(market, { status: "open" });
  for (let order of orders.results) {
    let orderPrice = Number(order.price) / PRICE_CONVERSION;
    if (tokenType === "short") {
      orderPrice = 1 - orderPrice;
    }
    if (orderPrice === price) {
      return true;
    }
  }
  return false;
}
