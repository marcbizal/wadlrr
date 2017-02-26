const wad = require('../lib/wad.js');

// This example extracts all files from a WAD to a directory of the same name.

const wadFile = '../LegoRR0.wad';
console.time(`Extracted ${wadFile}`);
wad.load(wadFile)
  .then(meta => wad.extract(meta))
  .then(() => console.timeEnd(`Extracted ${wadFile}`))
  .catch(console.log);
