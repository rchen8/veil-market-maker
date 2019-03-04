import Veil, { Market } from "veil-js";

export interface IMarketMakerParams {
  market: Market;
  veil: any;
  amount: number;
  side: "long" | "short";
}

export const cancelAllOrders = async (veil: Veil, market: Market) => {
  const userOrders = await veil.getUserOrders(market);
  for (let order of userOrders.results) {
    if (order.status === "open") await veil.cancelOrder(order.uid);
  }
  console.log(`Cancelled ${userOrders.results.length} orders`);
};

export default class MarketMaker {
  veil: Veil;
  amount: number;
  side: "long" | "short";

  constructor(veil: Veil, amount: number = 0, side: "long" | "short") {
    this.veil = veil;
    this.amount = amount;
    this.side = side;
  }

  get marketMakerParams() {
    return {
      veil: this.veil,
      amount: this.amount,
      side: this.side
    };
  }

  async start(marketSlug: string, marketMakeFunc: Function) {
    console.log("Starting market maker on market " + marketSlug);
    const market = await this.veil.getMarket(marketSlug);
    const run = async () => {
      while (true) {
        try {
          await marketMakeFunc({ market, ...this.marketMakerParams });
          break;
        } catch (e) {
          console.error(e);
          // Sleep 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      console.log("Waiting ten minutes to market make again...");
      setTimeout(run, 1000 * 60 * 10);
    };

    run();
  }
}
