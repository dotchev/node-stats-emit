'use strict';

const hrtimer = require('./hrtimer');

exports.start = function() {
  const startTime = hrtimer.start();
  const startCpu = process.cpuUsage();
  return {
    usage() {
      const cpu = process.cpuUsage(startCpu);
      const time = startTime.time_us();
      return Object.assign(cpu, {
        time,
        percent: (cpu.system + cpu.user) / time * 100
      });
    }
  };
}