const debug = require('debug');
const PREFIX = 'mongodb-compass-import-export';

const _LOGGERS = {};

export const createLogger = function(name) {
  if (!_LOGGERS[name]) {
    _LOGGERS[name] = debug(`${PREFIX}:${name}`);
  }
  return _LOGGERS[name];
};
