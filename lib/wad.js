const path = require('path');
const fs = require('fs');
const fsp = require('fs-promise');
const Parser = require('binary-parser').Parser;

module.exports = {

  /**
   * This function finds the index of a given path in a WAD file.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {string} filePath - the relative or absolute path of a file contained in the WAD
   * @returns {Number} - the index that the file was found at
   */

  indexOf(wadMeta, filePath) {
    return wadMeta.relative_paths.indexOf(filePath);
  },

  /**
   * This function checks if a file exists given path in a WAD file.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {string} filePath - the relative path of the file in question
   * @returns {Boolean}
   */

  exists(wadMeta, filePath) {
    return this.indexOf(wadMeta, filePath) !== -1;
  },

  /**
   * This function reads data for a given object from an open WAD file.
   * @param {Number} fd - file descriptor for the open WAD file
   * @param {Object} object - the object's metadata
   * @returns {Promise.<Buffer>} - resolves to a buffer containing the object data
   */

  getObjectFromFile(fd, object) {
    return Promise.resolve(new Buffer(object.file_size))
      .then(buffer => Promise.all([
        fsp.read(fd, buffer, 0, object.file_size, object.offset), buffer,
      ]))
      .then(([readResult, buffer]) => {
        if (readResult[0] !== object.file_size) {
          return Promise.reject(new Error('WAD object size inconsistent with metadata.'));
        }
        return buffer;
      });
  },

  /**
   * This function returns the object metadata at a given path in a WAD file
   * or throws an error if the file doesn't exist.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {string} filePath - the relative path of a file contained in the WAD
   * @returns {Object} - resolves to the object metadata
   */

  getObjectMeta(wadMeta, filePath) {
    const index = this.indexOf(wadMeta, filePath);
    if (index === -1) return new Error(`WAD does not contain ${filePath}`);
    return wadMeta.objects[index];
  },

  /**
   * This function reads a buffer from a given WAD that represents the actual object data.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {Object} object - the object's metadata
   * @returns {Promise.<Buffer>} - resolves to a buffer containing the object data
   */

  getObject(wadMeta, object) {
    return fsp.open(wadMeta.source, 'r')
      .then(fd => Promise.all([fd, this.getObjectFromFile(fd, object)]))
      .then(([fd, buffer]) => {
        fsp.close(fd);
        return buffer;
      });
  },

  /**
   * This function reads a buffer that represents object data at a given path.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {string} filePath - the object's internal path
   * @returns {Promise.<Buffer>} - a buffer containing the object data
   */

  getObjectAtPath(wadMeta, filePath) {
    return this.getObject(wadMeta, this.getObjectMeta(wadMeta, filePath));
  },

  /**
   * This function gets a read stream for a given object
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {Object} object - the object's metadata
   * @returns {ReadStream} - a read stream for the object
   */

  getObjectStream(wadMeta, object) {
    return fs.createReadStream(wadMeta.source, {
      start: object.offset,
      end: object.offset + object.file_size,
    });
  },

  /**
   * This function gets a stream for object data at a given path.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {string} filePath - the object's internal path
   * @returns {ReadStream} - a read stream for the object
   */

  getObjectStreamAtPath(wadMeta, filePath) {
    return this.getObjectStream(wadMeta, this.getObjectMeta(wadMeta, filePath));
  },

  /**
   * This function extracts all files from a given WAD.
   * @param {Object} wadMeta - any valid WAD metadata object
   * @param {string} outputPath - the base output path
   * @returns {Promise} - resolves when all files have been extracted
   */

  extract(wadMeta, outputPath = path.basename(wadMeta.source, '.wad')) {
    return new Promise((fulfill, reject) => {
      let completed = 0;

      fsp.mkdirs(outputPath).then(() => fsp.open(wadMeta.source, 'r'))
        .then((fd) => {
          wadMeta.objects.forEach((object, index) => {
            this.getObjectFromFile(fd, object)
            .then(buffer => Promise.all([
              buffer,
              fsp.mkdirs(path.join(outputPath, path.dirname(wadMeta.relative_paths[index]))),
            ]))
            .then(([buffer]) =>
              fsp.writeFile(path.join(outputPath, wadMeta.relative_paths[index]), buffer))
            .then(() => {
              completed += 1;
              if (completed >= wadMeta.objects.length) {
                fsp.close(fd).then(() => fulfill(true));
              }
            })
            .catch(error => reject(error));
          });
        });
    });
  },

  /**
   * This function parses a WAD file's metadata.
   * @param {string} wadPath - path to the WAD file itself
   * @returns {Object} - metadata describing the WAD
   */

  load(wadPath) {
    const filenameParser = Parser.start()
      .string('', {
        zeroTerminated: true,
      });

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

    return fsp.readFile(wadPath).then((data) => {
      const wadMeta = wadParser.parse(data);
      wadMeta.source = wadPath;

      return wadMeta;
    });
  },
};
