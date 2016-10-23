'use strict';

const cpuStats = require('cpu-percentage');
const EventEmitter = require('events');
const _ = require('lodash');
const os = require('os');
const querystring = require('querystring');

class StatsEmitter extends EventEmitter {
  constructor(options) {
    super();
    options = options || process.env.STATS_EMIT;
    if (!options) {
      this._options = { period: 0 };
    } else switch (typeof options) {
      case 'object':
        this._options = options;
        break;
      case 'string':
        this._options = querystring.parse(options);
        for (var k in this._options) {
          if (this._options[k] === '') { // '' is the default value given by querystring.parse 
            this._options[k] = true;
          }
        }
        break;
    }
    _.defaults(this._options, { period: 5 });
    if (this._options.all) {
      _.defaults(this._options, {
        sysload: true,
        freemem: true,
        cpu: true
      });
    }
    console.log(this._options); //debug
    this._stats = {
      cpuCount: os.cpus().length
    };
  }

  start() {
    if (this._options.period > 0) {
      this.timeout = setInterval(this._emitStats.bind(this), this._options.period * 1000);
    }
  }

  stop() {
    if (this.timeout) {
      clearInterval(this.timeout);
      delete this.timeout;
    }
  }

  _collectStats(cb) {
    var stats = {};
    if (this._options.sysload) {
      stats['sysload%'] = Math.round(os.loadavg()[0] / this._stats.cpuCount * 100);
    }
    if (this._options.freemem) {
      stats.freememMB = Math.round(os.freemem() / 1000000);
    }
    if (this._options.cpu) {
      this._stats.cpu = cpuStats(this._stats.cpu);
      stats['cpu%'] = Math.round(this._stats.cpu.percent);
    }
    cb(null, stats);
  }

  _emitStats() {
    this._collectStats((err, stats) => {
      if (err) {
        return console.error(err.stack);
      }
      if (this.listenerCount('stats') > 0) {
        this.emit('stats', stats);
      } else {
        console.log(stats);
      }
    });
  }
}

module.exports = StatsEmitter;
