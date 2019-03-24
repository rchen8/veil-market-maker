/* 
yarn build && node dist/index.js notification will-2020-presidential-candidate-andrew-yang-have-250-000-or-more-twitter-followers-on-april-1-2019-37458e3c --side short

TODO:
- wait for Veil API to support market orders
 */

require("dotenv").config();

import * as Twilio from "twilio";
import { IMarketMakerParams } from "../MarketMaker";

const BREAK_EVEN_PRICE = 0.98;
const PRICE_CONVERSION = 10000.0;
const AMOUNT_CONVERSION = 100000000000000;

let sentMessages:string[] = [];

export default async (params: IMarketMakerParams) => {
  const { market, veil, side } = params;

  const asks = await veil.getAsks(market, side);
  for (let ask of asks.results) {
    const price = Number(ask.price) / PRICE_CONVERSION;
    const amount = Number(ask.tokenAmount) / AMOUNT_CONVERSION;
    if (price >= BREAK_EVEN_PRICE) {
      continue;
    }
    
    if (!sentMessages.includes(amount + " " + price)) {
      const client = new (Twilio as any)(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);
      await client.messages.create({
        body: "Amount: " + amount + ", Price: " + price + ", Total: " + (amount * price),
        to: process.env.TO_PHONE_NUMBER,
        from: process.env.FROM_PHONE_NUMBER,
      }).then((message: any) => console.log(message.sid));
      sentMessages.push(amount + " " + price);
    }
  }
};
