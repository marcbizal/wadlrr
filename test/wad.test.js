var wad = require('../lib/wad.js');

var expect = require('chai').expect;
var fs = require('fs');

describe('WAD', function() {

	let LegoRR1 = null;

	before(() => {
		return wad.load('./LegoRR1.wad').then((wd) => { LegoRR1 = wd; });
	});

	it('should have a magic code of \'WWAD\' given test file \'LegoRR1.wad\'', function() {
		expect(LegoRR1.magic).to.be.equal('WWAD');
	});

	it('should have a file count of 214 given test file \'LegoRR1.wad\'', function() {
		expect(LegoRR1.file_count).to.be.equal(214);
	});

	it('should return a buffer representing text given the path \'credits.txt\'', function() {
		return wad.get('./LegoRR1.wad', LegoRR1, 'credits.txt').then((credits) => {
			fs.readFile('credits.txt', (error, data) => {
				if (error) throw error;
				return expect(credits).to.be.equal(data);
			})
		});
	});
});
