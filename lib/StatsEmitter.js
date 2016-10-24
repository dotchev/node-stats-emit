'use strict';

const async = require('async');
const cpuStats = require('cpu-percentage');
const EventEmitter = require('events');
const _ = require('lodash');
const os = require('os');
const querystring = require('querystring');

const hrtimer = require('./hrtimer');

const features = {
  sysload: true,
  freemem: true,
  cpu: true,
  rss: true,
  rps: true,
  heap: true,
  evloop: true,
  numconn: true
};

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
          var val = this._options[k].toLowerCase();
          if (val === '' || val === 'true') { // '' is the default value given by querystring.parse 
            this._options[k] = true;
          } else if (val === 'false') {
            this._options[k] = false;
          }
        }
        break;
    }
    _.defaults(this._options, { period: 5 });
    if (this._options.all) {
      _.defaults(this._options, features);
    }
    this._stats = {
      cpuCount: os.cpus().length
    };
  }

  start(options) {
    Object.assign(this._options, options);
    if (!this._options.server) {
      Object.assign(this._options, { rps: false });
    }
    if (this._options.period > 0) {
      if (this._options.rps) {
        this._stats.reqCount = 0;
        this._options.server.on('request', (req, res) => ++this._stats.reqCount);
      }
      this.timeout = setInterval(this._emitStats.bind(this), this._options.period * 1000);
      this.timeout.unref();
      this._stats.time = Date.now();
    }
  }

  stop() {
    if (this.timeout) {
      clearInterval(this.timeout);
      delete this.timeout;
    }
  }

  _collectStats(cb) {
    var stats = this._collectSyncStats();
    var collectors = {};
    if (this._options.evloop) {
      collectors.evloop_us = measureEventLoopLatency.bind(this);
    }
    if (this._options.numconn && this._options.server) {
      collectors.numconn = countConnections.bind(this);
    }
    async.parallel(collectors, (err, results) => {
      if (err) {
        cb(err);
      } else {
        Object.assign(stats, results);
        cb(null, stats);
      }
      this._stats.time = Date.now();
    })
  }

  _collectSyncStats() {
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
    var memUsage = process.memoryUsage();
    if (this._options.rss) {
      stats.rssMB = Math.round(memUsage.rss / 1000000);
    }
    if (this._options.heap) {
      stats.heapMB = Math.round(memUsage.heapUsed / 1000000);
    }
    if (this._options.rps) {
      var time = Date.now() - this._stats.time;
      stats.rps = Math.round(this._stats.reqCount / time * 1000);
      this._stats.reqCount = 0;
    }
    return stats;
  }

  _emitStats() {
    this._collectStats((err, stats) => {
      if (err) {
        return console.error(err.stack);
      }
      if (this.listenerCount('stats') > 0) {
        this.emit('stats', stats);
      } else {
        console.log(JSON.stringify(stats));
      }
    });
  }
}

function measureEventLoopLatency(cb) {
  var timer = hrtimer.start();
  setImmediate(() => {
    cb(null, Math.round(timer.time_us()));
  });
}

function countConnections(cb) {
  this._options.server.getConnections(cb);
}

module.exports = StatsEmitter;
