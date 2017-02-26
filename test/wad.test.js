/* global describe before after it */

const wad = require('../lib/wad.js');
const lint = require('mocha-eslint');
const expect = require('chai').expect;
const fsp = require('fs-promise');

// LINTING SETTINGS
const paths = [
  'lib',
  'test',
  'examples',
];

const options = {
  formatter: 'stylish',
  alwaysWarn: false,
  timeout: 5000,
  slow: 1000,
};

describe('wad', () => {
  let LegoRR1 = null;

  before(() => wad.load('./LegoRR1.wad').then((meta) => { LegoRR1 = meta; }));

  describe('#load()', () => {
    it('should expect a magic code of \'WWAD\' given test file \'LegoRR1.wad\'', () => {
      expect(LegoRR1.magic).to.be.equal('WWAD');
    });

    it('should expect a file count of 214 given test file \'LegoRR1.wad\'', () => {
      expect(LegoRR1.file_count).to.be.equal(214);
    });
  });

  describe('#getObjectAtPath()', () => {
    it('should expect a buffer representing text given the path \'credits.txt\'', (done) => {
      wad.getObjectAtPath(LegoRR1, 'credits.txt')
        .then(credits => Promise.all([fsp.readFile('./test/credits.txt'), credits]))
        .then(([control, credits]) => expect(credits).to.deep.equal(control))
        .then(() => done())
        .catch(console.log);
    });
  });
  describe('#exists()', () => {
    it('should expect \'Lego.cfg\' to exist, and \'Lego.config\' not to', (done) => {
      Promise.all([
        wad.exists(LegoRR1, 'Lego.cfg').then(exists => expect(exists).to.be.equal(true)),
        wad.exists(LegoRR1, 'Lego.config').then(exists => expect(exists).to.be.equal(false)),
      ])
      .then(() => done());
    });
  });

  describe('#extract()', () => {
    it('should expect all files to be extracted to \'LegoRR1\' given test file \'LegoRR1.wad\'', (done) => {
      wad.extract(LegoRR1)
        .then(() => Promise.all([
          fsp.stat('./LegoRR1').then(stat => stat.isDirectory()),
          fsp.stat('./LegoRR1/Lego.cfg').then(stat => stat.isFile()),
        ]))
        .then(([dir, file]) => {
          expect(dir).to.be.equal(true);
          expect(file).to.be.equal(true);
        })
        .then(() => done())
        .catch(console.log);
    });
  });

  after(() => fsp.remove('./LegoRR1'));
});

lint(paths, options);
