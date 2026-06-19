// Publish guard: fail if the type declarations weren't generated.

const fs = require('fs');

const entry = 'lib/typescript/index.d.ts';
if (!fs.existsSync(entry)) {
  console.error(`\n✖ ${entry} is missing — type declarations were not generated.`);
  console.error(
    '  Run `npm install` to ensure all peer deps (e.g. expo-secure-store) are\n' +
      '  present, then `npm run prepare`. Aborting publish.\n'
  );
  process.exit(1);
}
console.log(`✔ type declarations present (${entry})`);
