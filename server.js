const redis = require('redis');
const bodyParser = require('body-parser')
const express = require('express')
const cors = require('cors')

const MESSAGE_PACK_SIZE = 10

const createIPCmessage = (type, data) => (JSON.stringify({
  data,
  type
}))

const init = async () => {
  const app = express()
  app.use(bodyParser.json())
  app.use(cors())
  const pub = redis.createClient();
  const sub = pub.duplicate();
  const messages = []

  await pub.connect();
  await sub.connect();
  app.post('/message', (req, res) => {
    pub.publish('channel', createIPCmessage('message', req.body));
    res.send("ok")
    res.end()
  })
  sub.subscribe('channel', (message) => {
    console.log(message)
    const IPCmessage = JSON.parse(message)
    if (IPCmessage.type === 'message') {
      messages.unshift(IPCmessage.data)
      console.log(messages)
    } else if (IPCmessage.type === 'request_messages_on_init') {
      const from = IPCmessage.data.from
      if (process.env.PORT !== from) {
        pub.publish('channel', createIPCmessage('get_messages_on_init', {
          messages,
          to: from
        }));
      }
    } else if (IPCmessage.type === 'get_messages_on_init') {
      const to = IPCmessage.data.to
      if (process.env.PORT === to) {
        const initMessages = IPCmessage.data.messages
        initMessages.reverse()
        initMessages.forEach((m) => {
          messages.unshift(m)
        })
        console.log(messages)
      }
    }
  });
  pub.publish("channel", createIPCmessage('request_messages_on_init', {
    from: process.env.PORT
  }))
  app.get('/messages', (req, res) => {
    const messagePack = messages.slice(0, MESSAGE_PACK_SIZE)
    res.send(JSON.stringify(messagePack))
    res.end()
  })
  app.listen(process.env.PORT, () => {
    console.log(`listening on port ${process.env.PORT}`)
  })
}

init()