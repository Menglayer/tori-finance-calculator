import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const ENDPOINT = 'https://app.tori.finance/api/leaderboard';
const outputPath = resolve(process.argv[2] || 'data/leaderboard.json');

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function validate(payload) {
  if (!payload || !Array.isArray(payload.leaderboard) || payload.leaderboard.length === 0) {
    throw new Error('Leaderboard payload has no rows');
  }
  if (!Number.isFinite(Number(payload.totalPoints)) || !Number.isFinite(Number(payload.totalWallets))) {
    throw new Error('Leaderboard totals are invalid');
  }
  return payload;
}

try {
  const response = await fetch(ENDPOINT, {
    headers: { accept: 'application/json', 'user-agent': 'tori-cores-calculator-pages/1.0' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Tori API returned HTTP ${response.status}`);
  const payload = validate(await response.json());
  const output = {
    ...payload,
    fetchedAt: new Date().toISOString(),
    source: ENDPOINT,
  };
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Saved ${output.leaderboard.length} rows to ${outputPath}`);
} catch (error) {
  if (await fileExists(outputPath)) {
    const fallback = JSON.parse(await readFile(outputPath, 'utf8'));
    validate(fallback);
    console.warn(`Live sync failed; keeping existing snapshot: ${error.message}`);
  } else {
    console.error(error);
    process.exitCode = 1;
  }
}
