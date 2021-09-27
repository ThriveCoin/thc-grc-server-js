'use strict'

const Link = require('grenache-nodejs-link')
const { extractPublicMethods } = require('./utils')

class GrcWrkBase {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Grc service name
   * @param {number} opts.port - Grc service port
   * @param {string} opts.grape - Grape URL
   * @param {number} [opts.announce] - Grc announce interval
   */
  constructor ({ name, port, grape, announce = 15000 }) {
    this._link = new Link({ grape })

    this._name = name
    this._port = port
    this._announce = announce
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
      if (typeof this[key] !== 'function') continue

      this._actions.set(key, true)
    }

    this._link.start()
    this._peerServer.init() // should be inited on extended class
    this._service = this._peerServer.transport('server')
    this._service.listen(this._port)

    await new Promise((resolve, reject) => {
      this._link.announce(this._name, this._port, {}, (err) => err ? reject(err) : resolve())
    })
    this._link.startAnnouncing(this._name, this._port, { interval: this._announce })

    this._service.on('request', this.handler.bind(this))
  }

  stop () {
    this._link.stopAnnouncing(this._name, this._port)
    this._service.stop()
    this._peerServer.stop()
    this._link.stop()
  }

  async handler (rid, serviceName, payload, handler) {
    try {
      if (serviceName !== this._name) throw new Error('ERR_GRC_SERVICE_NOT_SUPPORTED')
      if (typeof payload !== 'object') throw new Error('ERR_GRC_BAD_REQUEST')

      const { action, args } = payload
      if (!this._actions.has(action)) throw new Error('ERR_GRC_ACTION_NOT_FOUND')

      const resp = await this[action](...args)
      handler.reply(null, resp)
    } catch (err) {
      handler.reply(err)
    }
  }
}

module.exports = GrcWrkBase
