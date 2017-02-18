var fs = require('fs');
var Parser = require('binary-parser').Parser;

class WADObject {
	constructor() {

	}

	saveAs() {

	}
}

class WAD {
	constructor(path, callback) {
		this.objects = [];

		if (path) this.load(path, callback);
	}

	extract(path, callback) {

	}

	load(path, callback) {
		var FilenameParser = Parser.start()
			.string('', { zeroTerminated: true });

		var WADObjectParser = Parser.start()
			.endianess('little')
			.uint32('version')
			.uint32('file_size')
			.skip(4)
			.uint32('offset');

		var WADParser = Parser.start()
			.endianess('little')
			.string('magic', { length: 4, assert: 'WWAD' })
			.uint32('file_count')
			.array('relative_paths', {
				type: FilenameParser,
				length: 'file_count'
			})
			.array('absolute_paths', {
				type: FilenameParser,
				length: 'file_count'
			})
			.array('objects', {
				type: WADObjectParser,
				length: 'file_count'
			});

		fs.readFile(path, (err, data) => {

			if (err) callback(err);

			let wad_data = WADParser.parse(data);

			this.magic 			= wad_data.magic;
			this.file_count 	= wad_data.file_count;
			this.objects 		= wad_data.objects;
			this.absolute_paths = wad_data.absolute_paths;
			this.relative_paths = wad_data.relative_paths;

			callback();
		});
	}

	save(path, callback) {

	}

	add() {

	}

	get() {

	}
}

module.exports.WAD = WAD;
module.exports.WADObject = WADObject;