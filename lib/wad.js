const fsp = require('fs-promise');
const Parser = require('binary-parser').Parser;

module.exports = {

  /**
   * This function executes a function for each object contained in a given WAD.
   * @param {Object} wadMeta any valid WAD metadata object
   * @param {Function} fn a function with three arguments (object, relative_path, absolute_path)
   */

  forEach(wadMeta, fn) {
    wadMeta.objects.forEach((object, index) => {
      fn(object, wadMeta.relative_paths[index], wadMeta.absolute_paths[index]);
    });
  },

  /**
   * This function finds the index of a given path in a WAD file.
   * @param {Object} wadMeta any valid WAD metadata object
   * @param {string} path the relative path of a file contained in the WAD
   * @returns {Promise} a promise that resolves to the index that the file was found at
   */

  indexOf(wadMeta, path) {
    return Promise.resolve(wadMeta.relative_paths.indexOf(path));
  },

  /**
   * This function returns the object metadata at a given path in a WAD file
   * or throws an error if the file doesn't exist.
   * @param {Object} wadMeta any valid WAD metadata object
   * @param {string} path the relative path of a file contained in the WAD
   * @returns {Object} a promise that resolves to the object metadata
   */

  getObjectMeta(wadMeta, path) {
    return this.indexOf(wadMeta, path).then((index) => {
      if (index === -1) return new Error(`WAD does not contain ${path}`);
      return wadMeta.objects[index];
    });
  },

  /**
   * This function reads a buffer from a given WAD that represents the actual object data.
   * @param {Object} wadMeta any valid WAD metadata object
   * @param {Object} object the object's metadata
   * @returns {Promise} a promise that resolves to a buffer containing the object data
   */

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

  /**
   * This function reads a buffer that represents object data at a given path.
   * @param {string} wadPath path to the WAD file itself
   * @param {Object} wadMeta any valid WAD metadata object
   * @param {string} relPath the object's metadata
   * @returns {Promise} a promise that resolves to a buffer containing the object data
   */

  getObjectAtPath(wadPath, wadMeta, relPath) {
    return this.getObjectMeta(wadMeta, relPath).then(object => this.getObject(wadPath, object));
  },

  /**
   * This function parses a WAD file's metadata.
   * @param {string} path path to the WAD file itself
   * @returns {Object} metadata describing the WAD
   */

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
