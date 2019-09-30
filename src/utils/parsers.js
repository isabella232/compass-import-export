import { Transform } from 'stream';
const JSONParser = require('JSONStream').parse;
import { EJSON } from 'bson';
import csv from 'fast-csv';

/**
 * TODO: Switch to papaparse for `dynamicTyping` of values
 * https://github.com/mholt/PapaParse/blob/5219809f1d83ffa611ebe7ed13e8224bcbcf3bd7/papaparse.js#L1216
 *
 * or implement it on fast-csv etc. could be nice so we
 * could easily support existing `.<bson_type>()` suffix as
 * `mongoimport` does today.
 */

/**
 * A transform stream that turns file contents in objects
 * quickly and smartly.
 *
 * @returns {Stream.Transform}
 */
export const createCSVParser = function() {
  return csv.parse({
    headers: true,
    ignoreEmpty: true
  });
};

/**
 * A transform stream that converts a string of JSON
 * into an object or an array.
 *
 * @returns {Stream.Transform}
 */
export const createJSONParser = function({ selector = '*' } = {}) {
  return new JSONParser(selector);
};

/**
 * A transform stream that always emits like `--jsonArray`
 * and deserializes any extended JSON objects into BSON.
 *
 * @returns {Stream.Transform}
 */
export const createEJSONDeserializer = function() {
  return new Transform({
    objectMode: true,
    transform: function(data, encoding, done) {
      const parsed = EJSON.deserialize(data);
      done(null, parsed);
    }
  });
};
