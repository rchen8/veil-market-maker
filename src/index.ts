#!/usr/bin/env node
require("dotenv").config();

import Veil from "veil-js";
import * as program from "commander";
import MarketMaker from "./MarketMaker";

import arbitrage from "./scripts/arbitrage"
import bestPrice from "./scripts/bestPrice"
import binary from "./scripts/binary";
import notification from "./scripts/notification"

process.on("unhandledRejection", err => {
  console.error(err);
  process.exit(1);
});

const botProgram = (commandString: string) => {
  return program
    .command(commandString)
    .option(
      "-a, --amount <amount>",
      "Add the order amount (ETH)",
      parseFloat
    )
    .option(
      "-s, --side <side>",
      "Add the side of the order (buy or sell)"
    )
    .option(
      "-t, --type <type>",
      "Add the type of order (long or short)"
    )
    .option(
      "-p, --price [price]",
      "Add the order price (ETH)",
      parseFloat
    );
};

const initVeil = () => {
  return new Veil(
    process.env.MNEMONIC,
    process.env.ADDRESS,
    process.env.API_URL
  );
}

const initMarketMaker = (cmd: { amount: number; price: number; side: "buy" | "sell", type: "long" | "short" }) => {
  const veil = initVeil();
  return new MarketMaker(veil, cmd.amount, cmd.price, cmd.side, cmd.type);
};

botProgram("arbitrage <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, arbitrage);
});

botProgram("best-price <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, bestPrice);
});

botProgram("binary <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, binary);
});

botProgram("notification <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, notification);
});

program.parse(process.argv);
