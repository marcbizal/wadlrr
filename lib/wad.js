const fsp = require('fs-promise');
const Parser = require('binary-parser').Parser;

module.exports = {
  forEach(wad, fn) {
    wad.objects.forEach((object, index) => {
      fn(object, wad.relative_paths[index], wad.absolute_paths[index]);
    });
  },

  indexOf(wadMeta, path) {
    return Promise.resolve(wadMeta.relative_paths.indexOf(path));
  },

  getObjectMeta(wadMeta, path) {
    return this.indexOf(wadMeta, path).then((index) => {
      if (index === -1) return new Error(`WAD does not contain ${path}`);
      return wadMeta.objects[index];
    });
  },

  getObject(wadPath, object) {
    return Promise.all([fsp.open(wadPath, 'r'), new Buffer(object.file_size)])
      .then(([fd, buffer]) => Promise.all([
        fsp.read(fd, buffer, 0, object.file_size, object.offset), fd, buffer,
      ]))
      .then(([readResult, fd, buffer]) => {
        fsp.close(fd);
        if (readResult[0] !== object.file_size) {
          return Promise.reject(new Error('WAD object size inconsistent with metadata.'));
        }

        return buffer;
      });
  },

  getObjectAtPath(wadPath, wadMeta, relPath) {
    return this.getObjectMeta(wadMeta, relPath).then(object => this.getObject(wadPath, object));
  },

  load(path) {
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
        length: 'file_count',
      })
      .array('absolute_paths', {
        type: filenameParser,
        length: 'file_count',
      })
      .array('objects', {
        type: objectParser,
        length: 'file_count',
      });

    return fsp.readFile(path).then(data => wadParser.parse(data));
  },
};
