import bsonCSV, { serialize } from './bson-csv';
import { EJSON, ObjectId, Long, BSONRegExp, Double } from 'bson';

// TODO: lucas: probably dumb but think about that later.

describe('bson-csv', () => {
  describe('Native', () => {
    describe('String', () => {
      it('should work', () => {
        expect(bsonCSV.String.fromString(1)).to.equal('1');
      });
    });
    describe('Boolean', () => {
      it('should deserialize falsy values', () => {
        expect(bsonCSV.Boolean.fromString('')).to.equal(false);
        expect(bsonCSV.Boolean.fromString('false')).to.equal(false);
        expect(bsonCSV.Boolean.fromString('FALSE')).to.equal(false);
        // expect(bsonCSV.Boolean.fromString('0')).to.equal(false);
      });
      it('should deserialize non-falsy values', () => {
        // expect(bsonCSV.Boolean.fromString('1')).to.equal(true);
        expect(bsonCSV.Boolean.fromString('true')).to.equal(true);
        expect(bsonCSV.Boolean.fromString('TRUE')).to.equal(true);
      });
    });
    describe('Number', () => {
      it('should work', () => {
        expect(bsonCSV.Number.fromString('1')).to.equal(1);
      });
    });
    describe('Date', () => {
      /**
       * Regression test for https://jira.mongodb.org/browse/COMPASS-4164
       */
      it('should serialize dates as ISO strings', () => {
        const doc = EJSON.deserialize({
          _id: '{47844C7F-544C-8986-E050-A8C063056488}',
          Price: 925000,
          'Date of Transfer': '2017-01-13T00:00:00Z'
        });
        expect(serialize(doc)).to.deep.equal({
          _id: '{47844C7F-544C-8986-E050-A8C063056488}',
          Price: '925000',
          'Date of Transfer': '2017-01-13T00:00:00Z'
        });
      });
    });
    describe('Undefined', () => {
      it('should serialize as a string', () => {
        expect(serialize({ value: undefined })).to.deep.equal({
          value: 'undefined'
        });
      });
    });
    describe('Null', () => {
      it('should serialize as a string', () => {
        expect(serialize({ value: null })).to.deep.equal({
          value: 'null'
        });
      });
    });
    describe('RegExp', () => {
      it('should serialize as a string', () => {
        expect(serialize({ value: /^mongodb/ })).to.deep.equal({
          value: '/^mongodb/'
        });
      });
    });
    describe('Array', () => {
      it('should serialize as a string of extended JSON', () => {
        expect(
          serialize({
            value: [
              new ObjectId('5e6652f22c09c775463d70f1'),
              new ObjectId('5e6652f62c09c775463d70f2')
            ]
          })
        ).to.deep.equal({
          value:
            '[{"$oid":"5e6652f22c09c775463d70f1"},{"$oid":"5e6652f62c09c775463d70f2"}]'
        });
      });
    });
    describe('Object', () => {
      it('should serialize plain objects in dot notation', () => {
        const doc = {
          _id: 'arlo',
          name: 'Arlo',
          location: {
            activity: {
              sleeping: 'true',
              is: 'on the couch'
            }
          }
        };
        expect(serialize(doc)).to.deep.equal({
          _id: 'arlo',
          name: 'Arlo',
          'location.activity.sleeping': 'true',
          'location.activity.is': 'on the couch'
        });
      });
    });

    describe('Boolean', () => {
      it('should serialize as a string', () => {
        expect(serialize({ value: false })).to.deep.equal({
          value: 'false'
        });

        expect(serialize({ value: true })).to.deep.equal({
          value: 'true'
        });
      });
    });
  });
  describe('bson', () => {
    describe('ObjectId', () => {
      it('should serialize ObjectId as the hex string value', () => {
        const oid = '5dd080acc15c0d5ee3ab6ad2';
        const deserialized = bsonCSV.ObjectId.fromString(oid);
        expect(deserialized._bsontype).to.equal('ObjectID');
        expect(deserialized.toString()).to.equal('5dd080acc15c0d5ee3ab6ad2');
      });
    });
    describe('Long', () => {
      it('should serialize as a string', () => {
        expect(serialize({ value: Long.fromNumber(245) })).to.deep.equal({
          value: '245'
        });
      });
    });
    describe('Double', () => {
      it('should not lose percision', () => {
        expect(bsonCSV.Double.fromString('79.8911483764648')).to.deep.equal(new Double('79.8911483764648'));
      });
    });
    describe('BSONRegExp', () => {
      it('should serialize as a string', () => {
        expect(serialize({ value: new BSONRegExp('^mongodb') })).to.deep.equal({
          value: '/^mongodb/'
        });

        expect(
          serialize({ value: new BSONRegExp('^mongodb', 'm') })
        ).to.deep.equal({
          value: '/^mongodb/m'
        });
      });
    });
  });
});
