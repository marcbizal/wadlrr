const wad = require('../lib/wad.js');
const fsp = require('fs-promise');

// This example very simply extracts a single file from the WAD

wad.load('../LegoRR1.wad')
  .then(meta => wad.getObjectAtPath('../LegoRR1.wad', meta, 'Sounds\\Voices\\Surfaces\\rubble.wav'))
  .then(buffer => fsp.writeFile('rubble.wav', buffer))
  .catch(console.log);
