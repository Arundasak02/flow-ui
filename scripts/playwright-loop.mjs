import { spawn } from 'node:child_process';

const iterations = Number(process.argv[2] ?? 5);
const delayMs = Number(process.argv[3] ?? 3000);

function runOnce(index) {
  return new Promise((resolve) => {
    const child = spawn(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['playwright', 'test', '--config=playwright.config.ts'],
      { stdio: 'inherit' },
    );
    child.on('close', (code) => resolve({ code, index }));
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let failures = 0;
for (let i = 1; i <= iterations; i += 1) {
  // eslint-disable-next-line no-console
  console.log(`\n=== Visual loop iteration ${i}/${iterations} ===`);
  // eslint-disable-next-line no-await-in-loop
  const { code } = await runOnce(i);
  if (code !== 0) failures += 1;
  if (i < iterations) {
    // eslint-disable-next-line no-await-in-loop
    await sleep(delayMs);
  }
}

// eslint-disable-next-line no-console
console.log(`\nVisual loop finished. Iterations: ${iterations}, failures: ${failures}`);
process.exit(failures > 0 ? 1 : 0);

