var expect = require('chai').expect;
var WAD = require('../lib/wad.js').WAD;

describe('WAD', function() {

	let LegoRR1 = null;

	before(function(done) {
		LegoRR1 = new WAD('./LegoRR1.wad', done);
	});

	it('should have a magic code of \'WWAD\' given test file \'LegoRR1.wad\'', function() {
		expect(LegoRR1.magic).to.be.equal('WWAD');
	});

	it('should have a file count of 214 given test file \'LegoRR1.wad\'', function() {
		expect(LegoRR1.file_count).to.be.equal(214);
	});
});