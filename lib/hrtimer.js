'use strict';

exports.start = function () {
  var start = process.hrtime();
  return {
    time_ms() { // milliseconds
      var t = process.hrtime(start);
      return t[0] * 1000 + t[1] / 1000000;
    },
    time_us() { // microseconds
      var t = process.hrtime(start);
      return t[0] * 1000000 + t[1] / 1000;
    },
    time_ns() { // nanoseconds
      var t = process.hrtime(start);
      return t[0] * 1e9 + t[1];
    }
  };
};
