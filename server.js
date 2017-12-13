var http = require('http'),
    ecstatic = require('ecstatic'),
    Router = require('./router');

var fileServer = ecstatic({root: './public'});
var router = new Router;

http.createServer((request, response) => {
  if (!router.resolve(request, response)) {
    fileServer(request, response);
  }
}).listen(8080);

var messages = []

function respond(response, status, data, type) {
  response.writeHead(status, {'Content-Type': type || 'text/plain'})
  response.end(data)
}
function respondJSON(response, status, data) {
  respond(response, status, JSON.stringify(data),
          {'Content-Type': 'application/json'})
}

router.add('GET', /^\/chat$/, (request, response) => {
  // respondJSON(response, 200, {messages: messages})
  var query = require('url').parse(request.url, true).query
  if (query.num) {
    var num = Number(query.num)
    if (messages[num]) {
      respondJSON(response, 200, {message: messages[num]})
    } else {
      waitForNewMessage(num, response)
    }

  } else {
    respond(response, 400, 'Invalid query string')
  }
})

function readStreamAsJSON(stream, callback) {
  var data = ''
  stream.on('data', chunk => {
    data += chunk
  })
  stream.on('end', () => {
    var parsedData, error
    try {
      parsedData = JSON.parse(data)
    } catch (err) {
      error = err
    }
    console.log(parsedData)
    callback(error, parsedData)
  })
  stream.on('error', err => {
    callback(err)
  })
}

router.add('PUT', /^\/chat$/, (request, response) => {
  readStreamAsJSON(request, (error, message) => {
    if (error) {
      console.error(error)
      respond(response, 400, error.toString()) 
    } else {
      messages.push(message)
      sendMessageForWaiters(message)
      respond(response, 204, null)
    }
  })
})

function sendMessageForWaiters(message) {
  waiting.forEach((waiter) => {
    respondJSON(waiter.response, 200, {message: message})
  })
  waiting = []
}

var waiting = []
function waitForNewMessage(since, response) {
  var waiter = {since: since, response: response}
  waiting.push(waiter)
  setTimeout(() => {
    var found = waiting.indexOf(waiter)
    // because some waiters have been done
    if (found > -1) {
      waiting.splice(found, 1)
      respond(response, 204, null)
    }
  }, 120 * 1000)
}
