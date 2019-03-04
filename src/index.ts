#!/usr/bin/env node
require("dotenv").config();

import Veil from "veil-js";
import * as program from "commander";
import MarketMaker from "./MarketMaker";
import BulkMarketMaker from "./BulkMarketMaker";

import binary from "./scripts/binary";
import arbitrage from "./scripts/arbitrage"
import bestPrice from "./scripts/bestPrice"

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
      parseFloat,
      0.5)
    .option(
      "-s, --side <side>",
      "Add the side of the trade (long or short)"
    );
};

const initVeil = () => {
  return new Veil(
    process.env.MNEMONIC,
    process.env.ADDRESS,
    process.env.API_URL
  );
}

const initMarketMaker = (cmd: { amount: number; side: "long" | "short" }) => {
  const veil = initVeil();
  return new MarketMaker(veil, cmd.amount, cmd.side);
};

botProgram("binary <market>").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, binary);
});

botProgram("arbitrage").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, arbitrage);
});

botProgram("best-price").action(async (market: string, cmd) => {
  const marketMaker = initMarketMaker(cmd);
  await marketMaker.start(market, bestPrice);
});

botProgram("bulk").action(async cmd => {
  const veil = initVeil();
  const marketMaker = new BulkMarketMaker(veil, cmd.amount, cmd.side);
  await marketMaker.start();
});

program.parse(process.argv);
