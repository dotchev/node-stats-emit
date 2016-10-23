'use strict';

const StatsEmitter = require('./StatsEmitter');

module.exports = function create(options) {
  return new StatsEmitter(options);
}
