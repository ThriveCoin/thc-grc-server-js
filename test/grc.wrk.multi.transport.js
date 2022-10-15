'use strict'

/* eslint-env mocha */

const assert = require('assert')
const createGrapes = require('bfx-svc-test-helper/grapes')
const mockdate = require('mockdate')
const sinon = require('sinon')
const utils = require('util')
const { GrcHttpClient, GrcWsClient } = require('@thrivecoin/grc-client')
const { ThcHttpClient } = require('@thrivecoin/http-client')
const { GrcHttpWsWrk } = require('../')

class SampleWrk extends GrcHttpWsWrk {
  ping (from, message) {
    return { to: from, message }
  }

  getTime () {
    return Date.now()
  }

  calc () {
    throw new Error('SIMULATE')
  }

  _privCalc () {
    return 33
  }
}

describe('grc.http.ws.wrk.js tests', () => {
  const grape = 'http://127.0.0.1:30001'
  const svcName = 'rest:sample:wrk'
  const grcHttpClient = new GrcHttpClient({ grape })
  const grcWsClient = new GrcWsClient({ grape })
  const httpClient = new ThcHttpClient({ baseUrl: 'http://127.0.0.1:7070' })
  const grapes = createGrapes({})
  const wrk = new SampleWrk({ name: svcName, ports: [7070, 7071], grape })

  let errLog = ''
  let errLogStub = null

  before(async function () {
    this.timeout(5000)

    await grapes.start()
    grcHttpClient.start()
    grcWsClient.start()
    await wrk.start()

    mockdate.set(1665843499038)
    errLogStub = sinon.stub(console, 'error').callsFake((...params) => {
      errLog = utils.format(...params)
    })
  })

  beforeEach(() => {
    errLog = ''
  })

  after(async function () {
    this.timeout(5000)

    grcHttpClient.stop()
    grcWsClient.stop()
    wrk.stop()
    await grapes.stop()

    mockdate.reset()
    errLogStub.restore()
  })

  it('should send request and receive response from http transport layer', async () => {
    const res = await grcHttpClient.request(`http:${svcName}`, 'ping', ['john', 'hi'])
    assert.deepStrictEqual(res, { to: 'john', message: 'hi' })
  })

  it('should send request and receive response from ws transport layer', async () => {
    const res = await grcWsClient.request(`ws:${svcName}`, 'ping', ['john', 'hi'])
    assert.deepStrictEqual(res, { to: 'john', message: 'hi' })
  })

  it('should fail on wrong transport layer', async () => {
    await assert.rejects(
      () => grcHttpClient.request(`ws:${svcName}`, 'ping', ['john', 'hi']),
      (err) => {
        assert.ok(err instanceof Error)
        assert.strictEqual(err.message, 'ERR_REPLY_EMPTY')
        return true
      }
    )
  })

  it('should handle errors', async () => {
    await assert.rejects(
      () => grcHttpClient.request(`http:${svcName}`, 'calc', []),
      (err) => {
        assert.ok(err instanceof Error)
        assert.strictEqual(err.message, 'SIMULATE')
        assert.ok(errLog.includes(`${new Date().toISOString()} Error: SIMULATE`))
        return true
      }
    )
  })

  it('should fail when invalid payload is provided', async () => {
    await assert.rejects(
      () => grcHttpClient.request(`http:${svcName}`, 'calc'),
      (err) => {
        assert.ok(err instanceof Error)
        assert.strictEqual(err.message, 'ERR_GRC_ARGS_INVALID')
        assert.ok(errLog.includes(`${new Date().toISOString()} Error: ERR_GRC_ARGS_INVALID`))
        return true
      }
    )
  })

  it('should hide private methods', async () => {
    await assert.rejects(
      () => grcHttpClient.request(`http:${svcName}`, '_privCalc'),
      (err) => {
        assert.ok(err instanceof Error)
        assert.strictEqual(err.message, 'ERR_GRC_ACTION_NOT_FOUND')
        assert.ok(errLog.includes(`${new Date().toISOString()} Error: ERR_GRC_ACTION_NOT_FOUND`))
        return true
      }
    )
  })

  it('should reject request coming with wrong service name', async () => {
    const { body: res } = await httpClient.post('', {
      body: [
        '675830ae-0498-4036-9d79-92bb1d1f9803',
        'rest:wrong:wrk',
        { action: 'ping', args: ['john', 'hi'] }
      ],
      encoding: 'json'
    })

    assert.deepStrictEqual(res, [
      '675830ae-0498-4036-9d79-92bb1d1f9803',
      'ERR_GRC_SERVICE_NOT_SUPPORTED',
      null
    ])
  })

  it('should reject request coming with wrong payload', async () => {
    const { body: res } = await httpClient.post('', {
      body: [
        '675830ae-0498-4036-9d79-92bb1d1f9803',
        `http:${svcName}`,
        'ping'
      ],
      encoding: 'json'
    })

    assert.deepStrictEqual(res, [
      '675830ae-0498-4036-9d79-92bb1d1f9803',
      'ERR_GRC_BAD_REQUEST',
      null
    ])
  })
})
