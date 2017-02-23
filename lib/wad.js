var fs = require('fs');
var Parser = require('binary-parser').Parser;


function extract(path, callback) {

}

function forEach(wad, fn) {
	wad.objects.map((object, index, array) => {
		fn(object, wad.relative_paths[index], wad.absolute_paths[index]);
	});
}

function save(path, callback) {

}

function add() {

}

function remove() {

}

function indexOf(wad, path) {
	return wad.relative_paths.indexOf(path);
}

function get(wad_path, wad, path) {
	return new Promise((fulfill, reject) => {
		const index = indexOf(wad, path);
		if (index == -1) reject(new Error(`WAD does not contain ${path}`));

		const object = wad.objects[index];
		fs.open(wad_path, 'r', (error, fd) => {
			if (error) reject(new Error(error));
			const buffer = new Buffer(object.file_size);
		    fs.read(fd, buffer, 0, object.file_size, object.offset, (error, bytes_read, buffer) => {
				if (error) reject(new Error(error));
				if (bytes_read == object.file_size) fs.close(fd, () => {
					fulfill(buffer);
				});
			});
		});
	});
}

function load(path) {
	return new Promise((fulfill, reject) => {
		const filenameParser = Parser.start()
			.string('', { zeroTerminated: true });

		const objectParser = Parser.start()
			.endianess('little')
			.uint32('version')
			.uint32('file_size')
			.skip(4)
			.uint32('offset');

		const wadParser = Parser.start()
			.endianess('little')
			.string('magic', { length: 4, assert: 'WWAD' })
			.uint32('file_count')
			.array('relative_paths', {
				type: filenameParser,
				length: 'file_count'
			})
			.array('absolute_paths', {
				type: filenameParser,
				length: 'file_count'
			})
			.array('objects', {
				type: objectParser,
				length: 'file_count'
			});

		fs.readFile(path, (error, data) => {
			if (error) reject(error);

			fulfill(wadParser.parse(data));
		});
	});
}

module.exports = {
	load: load,
	get: get,
	indexOf: indexOf
};
