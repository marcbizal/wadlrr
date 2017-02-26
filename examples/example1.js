const wad = require('../lib/wad.js');
const fsp = require('fs-promise');
const path = require('path');

// This example very simply extracts a single file from the WAD.

const wadFile = '../LegoRR1.wad';
const file = 'Sounds/Voices/Surfaces/rubble.wav';
console.time(`Extracted ${file} from ${wadFile}`);
wad.load(wadFile)
  .then(meta => wad.getObjectAtPath(meta, file))
  .then(buffer => fsp.writeFile(path.basename(file), buffer))
  .then(() => console.timeEnd(`Extracted ${file} from ${wadFile}`))
  .catch(console.log);
