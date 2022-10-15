'use strict'

const GrcWrkBase = require('./grc.wrk.base')
const { extractPublicMethods } = require('./utils')

class GrcWrkMultiTransport extends GrcWrkBase {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Grc service name
   * @param {number[]} opts.ports - Grc service ports
   * @param {string} opts.grape - Grape URL
   * @param {number} [opts.announce] - Grc announce interval
   * @param {Object} [opts.conf] - Worker config
   * @param {string} [opts.env] - Worker environment
   */
  constructor ({ name, ports, grape, announce = 15000, conf = {}, env = 'development' }) {
    super({ name, port: ports[0], grape, announce, conf, env })

    this._ports = ports
    this._peerServers = [] // should be populated on extended class
    this._services = [] // shouldn't be touched on extended class

    delete this._port
    delete this._service
  }

  async start () {
    // set available methods
    this._actions = new Map()
    const skippedMethods = [
      '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__',
      'constructor', 'handler', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable',
      'start', 'stop', 'toLocaleString', 'toString', 'valueOf'
    ]
    for (const key of extractPublicMethods(this)) {
      if (skippedMethods.includes(key)) continue // disallow calling reseverd methods
      if (key.startsWith('_')) continue // disallow calling methods that start with _ (private standard naming)

      this._actions.set(key, true)
    }

    this._link.start()

    for (let i = 0; i < this._ports.length; i++) {
      const port = this._ports[i]

      const peerServer = this._peerServers[i]
      peerServer.init()
      const service = peerServer.transport('server')
      service.listen(port)

      await new Promise((resolve, reject) => {
        this._link.announce(this._name, port, {}, (err) => err ? reject(err) : resolve())
      })
      this._link.startAnnouncing(this._name, port, { interval: this._announce })

      service.on('request', this.handler.bind(this))

      this._services.push(service)
    }
  }

  stop () {
    this._link.stopAnnouncing(this._name, this._port)
    this._services.forEach(service => service.stop())
    this._peerServers.forEach(peerServer => peerServer.stop())
    this._link.stop()
  }
}

module.exports = GrcWrkMultiTransport
