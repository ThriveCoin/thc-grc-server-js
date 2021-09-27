# thc-grc-server-js

This package provides base classes for grenache server on node js through different transport layers.
Currently it supports the following transport layers:
- Http transport layer

## How to use

You can simply extend the base transport classes and implement your methods, example:
```js
const { GrcHttpWrk } = require('thc-grc-server')

class MyCalcWorker extends GrcHttpWrk {
  add(a, b) {
    return a + b 
  }
}

const wrk = new MyCalcWorker({
  name: 'my_cal_wrk',
  port: 7070,
  grape: 'http://127.0.0.1:30001'
})

await wrk.start()
```

Then you could call your method through a sample client script like this:
```js
const Link = require('grenache-nodejs-link')
const { PeerRPCClient } = require('grenache-nodejs-http')

const link = new Link({ grape: 'http://127.0.0.1:30001' })
link.start()

const peer = new PeerRPCClient(link, {})
peer.init()

const req = {
  action: 'add', // method that you want to invoike
  args: [1, 2] // arguments
}
peer.request('my_cal_wrk', req, {}, (err, res) => {
  if (err) {
    console.error(err)
    process.exit(-1)
  }
  console.log('res', res) // 3
})
```

P.S. it's important to note that any method that starts with `_` is not publicly available through RPC,
`_` could be used as convention to declare a method as private/not callable!

Sample examples could be found under [./examples](./examples) directory
