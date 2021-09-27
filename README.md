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

P.S. it's important to note that any method that starts with `_` is not publicly available through RPC,
`_` could be used as convention to declare a method as private/not callable!

Sample examples could be found under [./examples](./examples) directory
