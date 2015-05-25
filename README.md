# http-graceful-close
gracefully close http server with keep-alive connections.


## API

```js
var gracefulHttp = require('http-graceful-close');
```


### gracefulHttp.install(server: http.Server)

Install `Server.gracefulClose` to given server instance.

This must be called before first `listen`.


### gracefulHttp.createServer(listener: Function): http.Server
### new gracefulHttp.Server(options: Object)

Wrapper of `http` methods.


### server.gracefulClose(listener?: Function)

1. Close listening socket by `Server.close`
2. If there is request with headers not sent, set `Connection: close`
3. Or wait for 400ms timeout and destroy connection
