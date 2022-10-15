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
   * @param {string[]} opts.prefixes - Worker transport service name prefixes, should match number of ports
   */
  constructor ({ name, ports, grape, announce = 15000, conf = {}, env = 'development', prefixes }) {
    super({ name, port: ports[0], grape, announce, conf, env })

    this._ports = ports
    this._prefixes = prefixes
    this._peerServers = [] // should be populated on extended class
    this._services = [] // shouldn't be touched on extended class

    this._names = this._prefixes.map(prefix => `${prefix}:${this._name}`)

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
      const serviceName = this._names[i]

      const peerServer = this._peerServers[i]
      peerServer.init()
      const service = peerServer.transport('server')
      service.listen(port)

      await new Promise((resolve, reject) => {
        this._link.announce(serviceName, port, {}, (err) => err ? reject(err) : resolve())
      })
      this._link.startAnnouncing(serviceName, port, { interval: this._announce })

      service.on('request', this.handler.bind(this))

      this._services.push(service)
    }
  }

  async handler (rid, serviceName, payload, handler) {
    try {
      if (!this._names.includes(serviceName)) throw new Error('ERR_GRC_SERVICE_NOT_SUPPORTED')
      if (typeof payload !== 'object') throw new Error('ERR_GRC_BAD_REQUEST')

      const { action, args } = payload
      if (!this._actions.has(action)) throw new Error('ERR_GRC_ACTION_NOT_FOUND')
      if (!Array.isArray(args)) throw new Error('ERR_GRC_ARGS_INVALID')

      const resp = await this[action](...args)
      handler.reply(null, resp)
    } catch (err) {
      console.error(new Date().toISOString(), err)
      handler.reply(err)
    }
  }

  stop () {
    for (const serviceName of this._names) {
      this._link.stopAnnouncing(serviceName, this._port)
    }
    this._services.forEach(service => service.stop())
    this._peerServers.forEach(peerServer => peerServer.stop())
    this._link.stop()
  }
}

module.exports = GrcWrkMultiTransport
