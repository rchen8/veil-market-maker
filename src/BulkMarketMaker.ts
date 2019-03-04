import binary from "./scripts/binary";
import Veil, { Market } from "veil-js";

export default class BulkMarketMaker {
  veil: Veil;
  amount: number;
  side: "long" | "short";

  constructor(veil: any, amount: number = 1, side: "long" | "short") {
    this.veil = veil;
    this.amount = amount;
    this.side = side;
  }

  async start() {
    console.log("Starting bulk market maker");
    const run = async () => {
      while (true) {
        try {
          await this.marketMake();
          break;
        } catch (e) {
          console.error(e);
          // Sleep 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      console.log("Waiting five minutes to market make again...");
      setTimeout(run, 1000 * 60 * 5);
    };

    run();
  }

  get marketMakerParams() {
    return {
      veil: this.veil,
      amount: this.amount,
      side: this.side
    };
  }

  getMarketMakerForMarket(market: Market) {
    if (market.type === "yesno" && market.index) return binary;
    // if (market.type === "scalar" && market.index) return scalar;
    return null;
  }

  async marketMake(page: number = 0) {
    const markets = await this.veil.getMarkets({ status: "open", page });
    for (let market of markets.results) {
      const customMarketMakeFunc = this.getMarketMakerForMarket(market);
      if (customMarketMakeFunc) {
        console.log("Market making for", market.slug);
        try {
          await customMarketMakeFunc({
            market,
            ...this.marketMakerParams
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
    if (markets.total > (page + 1) * markets.pageSize) {
      await this.marketMake(page + 1);
    }
    return true;
  }
}
