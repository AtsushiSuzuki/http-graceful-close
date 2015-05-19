var http = require('http');
var util = require('util');

module.exports.createServer = createServer;
module.exports.Server = Server;
module.exports.install = install;

function createServer(listener) {
  var server = http.createServer.apply(http, arguments);
  return install(server);
}

function Server() {
  http.Server.apply(this, arguments);
  install(this);
}
util.inherits(Server, http.Server);

function install(server) {
  var conns = new Map([]);

  server.on('connection', function (conn) {
    conns.set(conn, null);
    conn.on('close', function () {
      conns.delete(conn);
    });
  });
  server.on('request', function (req, res) {
    var conn = req.connection;
    conns.set(conn, res);
    res.on('finish', function () {
      conns.set(conn, null);
    });
  });

  server.gracefulClose = function (done) {
    conns.forEach(function (res, conn) {
      if (res !== null && !res.headersSent) {
        debug('sending response with "Connection: close"');
        res.setHeader('Connection', 'close');
      } else if (res !== null) {
        res.on('finish', function () {
          setIdleTimeout(server, conn);
        });
      } else {
        setIdleTimeout(server, conn);
      }
    });

    return server.close.apply(server, arguments);
  };

  debug('graceful-http-server installed');
  return server;
}

function setIdleTimeout(server, conn) {
  var onTimeout = function () {
    debug('closing connection');
    conn.destroy();
    server.removeListener('request', onRequest);
  };
  conn.setTimeout(400, onTimeout);

  var onRequest = function (req, res) {
    if (conn === req.connection) {
      debug('sending response with "Connection: close"');
      res.setHeader('Connection', 'close');
      conn.removeListener('timeout', onTimeout);
      server.removeListener('request', onRequest);
    }
  };
  server.on('request', onRequest);
}

function debug(message) {
  // console.log.apply(console, arguments);
}
