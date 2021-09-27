'use strict'

const Link = require('grenache-nodejs-link')
const { PeerRPCClient } = require('grenache-nodejs-http')

const link = new Link({
  grape: 'http://127.0.0.1:30001'
})
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

const pingReq = {
  action: 'ping',
  args: ['john', 'hello']
}
peer.request('rest:sample:wrk', pingReq, { timeout: 10000 }, (err, res) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  console.log('pong', res)
})

const timeReq = {
  action: 'getTime',
  args: []
}
peer.request('rest:sample:wrk', timeReq, { timeout: 10000 }, (err, res) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  console.log('time', res)
})
