'use strict'

const GrcWrkMultiTransport = require('./grc.wrk.multi.transport')
const { PeerRPCServer: WsPeerRPCServer } = require('grenache-nodejs-ws')
const { PeerRPCServer: HttpPeerRPCServer } = require('grenache-nodejs-http')

class GrcHttpWsWrk extends GrcWrkMultiTransport {
  /**
   * @param {Object} opts
   * @param {string} opts.name - Grc service name
   * @param {number[]} opts.ports - Grc service ports
   * @param {string} opts.grape - Grape URL
   * @param {number} [opts.timeout] - Grc call timeout
   * @param {number} [opts.announce] - Grc announce interval
   * @param {Object} [opts.conf] - Worker config
   * @param {string} [opts.env] - Worker environment
   * @param {string[]} [opts.prefixes] - Worker transport service name prefixes, should match number of ports
   */
  constructor ({
    name, ports, grape, timeout = 30000, announce = 15000, conf = {}, env = 'development', prefixes = ['http', 'ws']
  }) {
    super({ name, ports, grape, announce, conf, env, prefixes })

    this._peerServers.push(
      new HttpPeerRPCServer(this._link, { timeout }),
      new WsPeerRPCServer(this._link, { timeout })
    )
  }
}

module.exports = GrcHttpWsWrk
