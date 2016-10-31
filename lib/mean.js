'use strict';

class Mean {
  constructor() {
    this.sum = 0;
    this.count = 0;
  }

  push(value) {
    this.sum += value;
    ++this.count;
  }

  get mean() {
    return this.sum / this.count || 0;
  }
}

module.exports = Mean;