function request(options, callback) {
  var xhr = new XMLHttpRequest()
  xhr.open(options.method || 'GET', options.pathname, true)
  xhr.addEventListener('load', () => {
    if (xhr.status < 400) {
      callback(null, xhr.responseText)
    } else {
      callback(new Error('Request failed: ' + xhr.status + ' ' + xhr.statusText))
    }
  })
  xhr.addEventListener('error', () => {
    callback(new Error('Network error'))
  })
  xhr.send(options.body || null)
}

var num = 0
request({pathname: '/chat?num=0'}, (err, response) => {
  if (err) {
    alert(err.toString())
  } else {
    // console.log(response === undefined)
    // console.log(typeof response)
    if (response !== '') {
      response = JSON.parse(response)
      console.log(response.message)
      displayMessage(response.message)
      num++
    }
    
    waitForNewMessage()
  }
})

var messagesDiv = document.querySelector('.messages')

function displayMessage(message) {
  var node = drawMessage(message)
  messagesDiv.appendChild(node)
  messagesDiv.scrollTop = messagesDiv.scrollHeight
}

function instantiateTemplate(name, values) {
  function instantiateText(text) {
    return text.replace(/\{\{(\w+)\}\}/g, (_, name) => {
      return values[name]
    })
  }
  function instantiate(node) {
    if (node.nodeType === document.ELEMENT_NODE) {
      var copy = node.cloneNode()
      for (var i = 0; i < node.childNodes.length; i++) {
        copy.appendChild(instantiate(node.childNodes[i]))
      }
      return copy
    } else if (node.nodeType === document.TEXT_NODE) {
      return document.createTextNode(instantiateText(node.nodeValue))
    }
  }

  var template = document.querySelector('.template .' + name)
  return instantiate(template)
}

var messageForm = document.querySelector('.new-message')
var sendBtn = messageForm.querySelector('.send-btn')
sendBtn.disabled = true

var contentInput = messageForm.querySelector('.content-input')
contentInput.addEventListener('input', event => {
  if (contentInput.value !== '') {
    sendBtn.disabled = false
  } else {
    sendBtn.disabled = true
  }
})

function drawMessage(message) {
  var node
  if (message.sender === messageForm.elements.sender.value) {
    node = instantiateTemplate('message-self', message)
  } else {
    node = instantiateTemplate('message-another', message)
  }

  return node
}

messageForm.addEventListener('submit', event => {
  event.preventDefault()
  send()
})

document.addEventListener('keyup', event => {
  event.preventDefault()
  if (event.which === 13) {
    if (document.activeElement === contentInput && 
        contentInput.value !== '') {
      send()
    }
  }

})

function send() {
  var body = {sender: messageForm.elements.sender.value,
              content: messageForm.elements.content.value,
              clientTime: Date.now()}
  request({pathname: '/chat', method:'PUT', body: JSON.stringify(body)},
          (err, res) => {
    if (err) {
      alert(err.toString())
    }
  })

  messageForm.elements.content.value = ''
}

var senderInput = messageForm.querySelector('.sender-input')
senderInput.addEventListener('change', event => {
  localStorage.setItem('sender', senderInput.value)
})

senderInput.value = localStorage.getItem('sender') || null

function waitForNewMessage() {
  request({pathname: '/chat?num=' + num}, (err, res) => {
    if (err) {
      alert(err.toString())
      setTimeout(waitForNewMessage, 3000)
    } else {
      if (res !== '') {
        res = JSON.parse(res)
        console.log(res.message)
        displayMessage(res.message)
        num++
      }
      waitForNewMessage()
    }
    
  })
}