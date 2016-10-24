# node-stats-emit
Node.js performance statistics emitter

## Install

```sh
npm install --save node-stats-emit
```

**Note:** requires node v4 or higher.

## Usage

```js
const statsEmitter = require('node-stats-emit')();

var app = express();
//...
var server = app.listen(PORT);
statsEmitter.start({ server });
```

```sh
export STATS_EMIT=all
npm start
```

Then performance metrics will be prtinted on the console each 5 seconds
```
{"sysload%":38,"freememMB":3583,"cpu%":97,"rssMB":150,"heapMB":17,"rps":2134,"numconn":85,"evloop_us":5678}
```
