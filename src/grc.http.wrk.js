'use strict'

const GrcWrkBase = require('./grc.wrk.base')
const { PeerRPCServer } = require('grenache-nodejs-http')

class GrcHttpWrk extends GrcWrkBase {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Grc service name
   * @param {number} opts.port - Grc service port
   * @param {string} opts.grape - Grape URL
   * @param {number} [opts.timeout] - Grc call timeout
   * @param {number} [opts.announce] - Grc announce interval
   * @param {Object} [opts.conf] - Worker config
   * @param {string} [opts.env] - Worker environment
   */
  constructor ({ name, port, grape, timeout = 30000, announce = 15000, conf = {}, env = 'development' }) {
    super({ name, port, grape, announce, conf, env })

    this._peerServer = new PeerRPCServer(this._link, { timeout })
  }
}

module.exports = GrcHttpWrk
