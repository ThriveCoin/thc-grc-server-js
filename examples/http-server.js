'use strict'

const { GrcHttpWrk } = require('../')

class SampleWrk extends GrcHttpWrk {
  ping (from, message) {
    return { to: from, message }
  }

  getTime () {
    return Date.now()
  }
}

/*
Start two grapes:
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
*/

const main = async () => {
  const wrk = new SampleWrk({
    name: 'rest:sample:wrk',
    port: 7070,
    grape: 'http://127.0.0.1:30001'
  })

  await wrk.start()
  console.log(`service started: ${wrk._name}:${wrk._port}`)
}

main()
