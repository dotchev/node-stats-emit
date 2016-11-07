'use strict';

const async = require('async');
const cpu = require('./cpu-gauge');
const EventEmitter = require('events');
const _ = require('lodash');
const os = require('os');
const querystring = require('querystring');
const requestStats = require('request-stats');
const clockit = require('clockit');
const Mean = require('./mean');

const features = {
  sysload: true,
  freemem: true,
  cpu: true,
  rss: true,
  rps: true,
  restime: true,
  reqbytes: true,
  resbytes: true,
  rxrate: true,
  txrate: true,
  heap: true,
  evloop: true,
  numconn: true
};

class StatsEmitter extends EventEmitter {
  constructor(options) {
    super();
    options = options || process.env.STATS_BEAT;
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
    this._cpuCount = os.cpus().length;
  }

  start(options) {
    var ops = this._options;
    Object.assign(ops, options);
    if (!ops.server) {
      Object.assign(ops, { rps: false });
    }
    this._stats = cleanStats();
    if (ops.period > 0) {
      if (ops.rps || ops.restime || ops.reqbytes || ops.resbytes ||
          ops.rxrate || ops.txrate) {
        requestStats(ops.server, requestComplete.bind(this));
      }
      this.timeout = setInterval(this._emitStats.bind(this), ops.period * 1000);
      this.timeout.unref();
    }
  }

  stop() {
    if (this.timeout) {
      clearInterval(this.timeout);
      delete this.timeout;
    }
  }

  _collectStats(cb) {
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
        var stats = this._collectSyncStats();
        Object.assign(stats, results);
        cb(null, stats);
      }
      this._stats = cleanStats();
    })
  }

  _collectSyncStats() {
    const ops = this._options;
    var time = Date.now() - this._stats.time;
    var stats = {};
    if (ops.sysload) {
      stats['sysload%'] = Math.round(os.loadavg()[0] / this._cpuCount * 100);
    }
    if (ops.freemem) {
      stats.freememMB = Math.round(os.freemem() / 1000000);
    }
    if (ops.cpu) {
      stats['cpu%'] = Math.round(this._stats.cpu.usage().percent);
    }
    var memUsage = process.memoryUsage();
    if (ops.rss) {
      stats.rssMB = Math.round(memUsage.rss / 1000000);
    }
    if (ops.heap) {
      stats.heapMB = Math.round(memUsage.heapUsed / 1000000);
    }
    if (ops.rps) {
      stats.rps = Math.round(this._stats.reqCount / time * 1000);
    }
    if (ops.restime) {
      stats.resTime_ms = this._stats.resTime.mean;
    }
    if (ops.reqbytes) {
      stats.reqBytes = Math.round(this._stats.reqBytes.mean);
    }
    if (ops.resbytes) {
      stats.resBytes = Math.round(this._stats.resBytes.mean);
    }
    if (ops.rxrate) {
      stats.rxKBs = Math.round(this._stats.reqBytes.sum / time);
    }
    if (ops.txrate) {
      stats.txKBs = Math.round(this._stats.resBytes.sum / time);
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
  var timer = clockit.start();
  setImmediate(() => {
    cb(null, Math.round(timer.us));
  });
}

function countConnections(cb) {
  this._options.server.getConnections(cb);
}

function requestComplete(stats) {
  ++this._stats.reqCount;
  this._stats.resTime.push(stats.time);
  this._stats.reqBytes.push(stats.req.bytes);
  this._stats.resBytes.push(stats.res.bytes);
}

function cleanStats() {
  return {
    time: Date.now(),
    reqCount: 0,
    cpu: cpu.start(),
    resTime: new Mean(),
    reqBytes: new Mean(),
    resBytes: new Mean()
  }
}


module.exports = StatsEmitter;
