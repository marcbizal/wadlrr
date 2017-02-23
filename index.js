const wad = require('./lib/wad.js');

wad.load('./LegoRR1.wad').then((LegoRR1) => {
	return wad.getObjectAtPath('./LegoRR1.wad', LegoRR1, 'credits.txt');
}).then((buffer) => { console.log(buffer.toString()); });
