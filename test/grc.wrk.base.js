'use strict'

/* eslint-env mocha */

const assert = require('assert')
const createGrapes = require('bfx-svc-test-helper/grapes')
const mockdate = require('mockdate')
const sinon = require('sinon')
const utils = require('util')
const { GrcHttpClient } = require('@thrivecoin/grc-client')
const { ThcHttpClient } = require('@thrivecoin/http-client')
const { GrcHttpWrk } = require('../')

class SampleWrk extends GrcHttpWrk {
  async ping (from, message) {
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

describe('grc.wrk.base.js tests', () => {
  const grape = 'http://127.0.0.1:30001'
  const svcName = 'rest:sample:wrk'
  const grcClient = new GrcHttpClient({ grape })
  const httpClient = new ThcHttpClient({ baseUrl: 'http://127.0.0.1:7070' })
  const grapes = createGrapes({})
  const wrk = new SampleWrk({ name: svcName, port: 7070, grape })

  let errLog = ''
  const errLogStub = sinon.stub(console, 'error')

  before(async function () {
    this.timeout(5000)

    await grapes.start()
    grcClient.start()
    await wrk.start()

    mockdate.set(1665843499038)
    errLogStub.callsFake((...params) => {
      errLog = utils.format(...params)
    })
  })

  beforeEach(() => {
    errLog = ''
  })

  after(async function () {
    this.timeout(5000)

    grcClient.stop()
    wrk.stop()
    await grapes.stop()

    mockdate.reset()
    errLogStub.restore()
  })

  it('should send and receive response', async () => {
    const res = await grcClient.request(svcName, 'ping', ['john', 'hi'])
    assert.deepStrictEqual(res, { to: 'john', message: 'hi' })
  })

  it('should work actions without params', async () => {
    const res = await grcClient.request(svcName, 'getTime', [])
    assert.strictEqual(res, 1665843499038)
  })

  it('should handle errors', async () => {
    await assert.rejects(
      () => grcClient.request(svcName, 'calc', []),
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
      () => grcClient.request(svcName, 'calc'),
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
      () => grcClient.request(svcName, '_privCalc'),
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
        svcName,
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
