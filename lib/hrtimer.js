'use strict';

exports.start = function () {
  var start = process.hrtime();
  return {
    time_ms() {
      var t = process.hrtime(start);
      return t[0] * 1000 + t[1] / 1000000;
    },
    time_us() {
      var t = process.hrtime(start);
      return t[0] * 1000000 + t[1] / 1000;
    }
  }
}