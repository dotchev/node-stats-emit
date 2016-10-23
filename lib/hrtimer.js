'use strict';

exports.start = function () {
  var start = process.hrtime();
  return {
    time: () => {
      var t = process.hrtime(start);
      return t[0] * 1000 + t[1] / 1000000;
    }
  }
}