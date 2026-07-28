import test from 'node:test';
import assert from 'node:assert/strict';
import {
  YT_MARKETS,
  calculateScenario,
  calculateYtPosition,
  daysUntil,
  projectNetworkTotal,
} from '../calculator.js';

const NOW = new Date('2026-07-28T00:00:00.000Z');

test('standard positions use USD notional times the published multiplier', () => {
  const result = calculateScenario({
    positions: [
      { id: 1, strategyId: 'tori_trusd', amount: 1000 },
      { id: 2, strategyId: 'curve_strusd_trusd', amount: 500 },
    ],
    days: 30,
    networkTotal: 1_000_000,
    now: NOW,
  });
  assert.equal(result.positionDailyCores, 32_500);
  assert.equal(result.positionCores, 975_000);
});

test('referral bonus adds ten percent of referred users Cores', () => {
  const result = calculateScenario({
    positions: [],
    referredDailyCores: 20_000,
    days: 12,
    networkTotal: 1_000_000,
    now: NOW,
  });
  assert.equal(result.referralDailyCores, 2_000);
  assert.equal(result.referralCores, 24_000);
});

test('YT uses live price-derived quantity and notional, then applies the 3 percent fee', () => {
  const result = calculateYtPosition({
    market: YT_MARKETS.yt_trusd,
    investment: 1_000,
    price: 0.04,
    underlyingPrice: 1,
    underlyingApy: 0,
    days: 10,
    now: NOW,
  });
  assert.equal(result.quantity, 25_000);
  assert.equal(result.notional, 25_000);
  assert.equal(result.leverage, 25);
  assert.equal(result.grossDailyCores, 750_000);
  assert.equal(result.dailyCores, 727_500);
  assert.equal(result.totalCores, 7_275_000);
});

test('YT accrual stops at expiry and residual goes to zero at expiry', () => {
  const expiryDays = daysUntil(YT_MARKETS.yt_strusd.expiry, NOW);
  const result = calculateYtPosition({
    market: YT_MARKETS.yt_strusd,
    investment: 500,
    price: 0.05,
    underlyingPrice: 1,
    underlyingApy: 0.1,
    days: expiryDays + 30,
    now: NOW,
  });
  assert.equal(result.pointDays, expiryDays);
  assert.equal(result.residualValue, 0);
  assert.equal(result.baseYield, result.notional * 0.1 * (expiryDays / 365) * 0.97);
});

test('network projection compounds the scenario growth and includes user incremental Cores', () => {
  const projected = projectNetworkTotal(1_000_000, 1, 2, 5_000);
  assert.equal(projected, 1_025_100);
});

test('valuation remains zero until the user supplies FDV and allocation', () => {
  const result = calculateScenario({
    currentCores: 100_000,
    positions: [{ id: 1, strategyId: 'tori_strusd', amount: 1_000 }],
    days: 30,
    networkTotal: 1_000_000_000,
    fdv: 0,
    airdropPercent: 0,
    now: NOW,
  });
  assert.equal(result.tokenPoolValue, 0);
  assert.equal(result.projectedAirdropValue, 0);
  assert.equal(result.coresApy, 0);
});
