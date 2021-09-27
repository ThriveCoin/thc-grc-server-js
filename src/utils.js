'use strict'

const extractPublicMethods = (obj) => {
  const props = []
  let currentObj = obj

  do {
    props.push(...Object.getOwnPropertyNames(currentObj))
    currentObj = Object.getPrototypeOf(currentObj)
  } while (currentObj)

  return props.sort().filter((key, i, arr) => {
    return (key !== arr[i + 1] && typeof obj[key] === 'function')
  })
}

module.exports = {
  extractPublicMethods
}
