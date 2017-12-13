function Router() {
  this.routes = [];
}

Router.prototype.add = function(method, url, handler) {
  this.routes.push({
    method: method,
    url: url,
    handler: handler
  });
}

Router.prototype.resolve = function(request, response) {
  var pathname = require('url').parse(request.url).pathname;
  return this.routes.some(route => {
    var match = route.url.exec(pathname)
    if (!match || route.method !== request.method) {
      return false;
    }
    var urlParts = match.slice(1).map(decodeURIComponent);
    route.handler.apply(null, [request, response].concat(urlParts));
    return true;
  });
}

module.exports = Router;