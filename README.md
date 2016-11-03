# stats-beat
Node.js performance statistics emitter

## Install

```sh
npm install --save stats-beat
```

**Note:** requires node v4 or higher.

## Usage

```js
const statsBeat = require('stats-beat')();

var app = express();
//...
var server = app.listen(PORT);
statsBeat.start({ server });
```

```sh
export STATS_BEAT=all
npm start
```

Then all performance metrics will be prtinted on the console each 5 seconds
```
{"sysload%":18,"freememMB":3661,"cpu%":112,"rssMB":152,"heapMB":64,"rps":3149,"resTime_ms":20.887753158529616,"reqBytes":116,"resBytes":114849,"rxKBs":365,"txKBs":361653,"numconn":80,"evloop_us":6646}
```

To report only CPU and memory ech 2s, use this command:
```sh
export STATS_BEAT='period=2&cpu&rss'
npm start
```

You can register a listener to process the performance metrics in a custom way, 
e.g. write them in a csv file or send them to a central service.

```js
const statsBeat = require('stats-beat')();

var app = express();
//...
var server = app.listen(PORT);
statsBeat.start({ server });
statsBeat.on('stats', (stats) => {
  // process stats
});
```

## Reference

### Stats

| Selector   | Property     | Description                            |
|------------|--------------|----------------------------------------|
| `sysload`  | `sysload%`   | 1 minute system load average as %. See [os.loadavg()](https://nodejs.org/api/os.html#os_os_loadavg) |
| `freemem`  | `frememMB`   | Free system memory in MB. See [os.freemem()](https://nodejs.org/api/os.html#os_os_freemem) |
| `cpu`      | `cpu%`       | Process CPU usage as % of one logical core. Requires node v6.1. See [process.cpuUsage()](https://nodejs.org/api/process.html#process_process_cpuusage_previousvalue) |
| `rss`      | `rssMB`      | Process memory (resident set size) in MB. See [process.memoryUsage()](https://nodejs.org/api/process.html#process_process_memoryusage) |
| `heap`     | `heapMB`     | V8 heap used. See [process.memoryUsage()](https://nodejs.org/api/process.html#process_process_memoryusage) |
| `rps`      | `rps`        | Completed requests per second. |
| `restime`  | `resTime_ms` | Average response time in ms. |
| `reqbytes` | `reqBytes`   | Average request size in bytes. |
| `resbytes` | `resBytes`   | Average response size in bytes. |
| `rxrate`   | `rxKBs`      | KB received per second |
| `txrate`   | `txKBs`      | KB sent per second |
| `numconn`  | `numconn`    | Number of concurrent connections on the server. See [server.getConnections()](https://nodejs.org/api/net.html#net_server_getconnections_callback) |
| `evloop`   | `evloop_us`  | Node event loop latency in microseconds |

Time-based statistics are reset on each event, i.e. they are measured since the previous event.
