'use strict'
/* eslint-disable no-param-reassign */
const SPLIT_REG_EXP = /[.[\]]/g

/**
 * This class allows to set or get specific
 * values within a json data structure using
 * string-based paths
 *
 * @param {String} path A path, e.g. users[2].firstname
 *
 * @constructor
 */
const JsonPath = function (path) {
  this._path = path
  this._tokens = []
  this._tokenize()
}

/**
 * Sets the value of the path. If the path (or parts
 * of it) doesn't exist yet, it will be created
 *
 * @param {Object} node
 * @param {Mixed} value
 *
 * @public
 * @returns {void}
 */
JsonPath.prototype.setValue = function (node, value) {
  let i = 0

  for (i = 0; i < this._tokens.length - 1; i++) {
    if (node[this._tokens[i]] !== undefined) {
      node = node[this._tokens[i]]
    } else if (this._tokens[i].indexOf('=') > 0) {
      const arrParts = this._tokens[i].split('=')
      const token = arrParts[0]

      if (node[token] !== undefined) {
        node = node[token]
      } else {
        node = node[token] = []
      }

      // _tokens parts could contain array of arrays 'part'
      // (e.g. arr[0][1][2][3][4]...[n])
      // => tokenized as arr=0=1=2=3=4...=n
      // --> code above handles the first part ('arr')
      //     of the array token part (arr=0=1=2=3=4...=n)
      // --> code below handles looping over the multi-dim part ('=0=1=2=3=4..=n')
      //     of the array token part (arr=0=1=2=3=4..=n))
      let j = 0
      for (j = 1; j < arrParts.length; j++) {
        const idx = parseInt(arrParts[j], 10)
        if (node[idx] !== undefined) {
          if (node[idx] instanceof Object || node[idx] instanceof Array) {
            node = node[idx]
          }
        } else if (j < (arrParts.length - 1)) {
          node = node[idx] = []
        } else if (this._tokens[i + 1].indexOf('=') > 0) {
          node = node[idx] = []
        } else {
          node = node[idx] = {}
        }
      }

    } else {
      node = node[this._tokens[i]] = {}
    }
  }

  if (this._tokens[i].indexOf('=') > 0) {
    const arrParts = this._tokens[i].split('=')
    const token = arrParts[0]

    if (node[token] !== undefined) {
      node = node[token]
    } else {
      node = node[token] = []
    }
    // _tokens parts could contain array of arrays 'part'
    // (e.g. arr[0][1][2][3][4]...[n])
    // => tokenized as arr=0=1=2=3=4...=n
    // --> code above handles the first part ('arr')
    //     of the array token part (arr=0=1=2=3=4...=n)
    // --> code below handles looping over the multi-dim part ('=0=1=2=3=4..=n')
    //     of the array token part (arr=0=1=2=3=4..=n))
    let j = 0
    let idx = undefined
    for (j = 1; j < arrParts.length; j++) {
      idx = parseInt(arrParts[j], 10)
      if (node[idx] !== undefined) {
        if (node[idx] instanceof Object || node[idx] instanceof Array) {
          node = node[idx]
        }
      } else if (j < (arrParts.length - 1)) {
        node = node[idx] = []
      }
    }
    node[idx] = value
  } else {
    node[this._tokens[i]] = value
  }
}

/**
 * Parses the path. Splits it into
 * keys for objects and indices for arrays.
 *
 * @private
 * @returns {void}
 */
JsonPath.prototype._tokenize = function () {

  // makes json path array items a single 'part' value of parts below
  // 'arrayProp[#]' members transform to 'arrayProp=#' now instead of 'arrayProp.#' previously
  // see setValue fnc above for special handling of array item parsing vs numeric obj member name
  // e.g. 'object.1' parsing. this allows for support of parsing and differentiating object
  // member names that are also numeric values
  // also supports multi-dimensional arrays e.g. arr[0][1][2][3]... => arr=0=1=2=3...
  let str = this._path.replace(/\s/g, '')
  str = str.replace(/\[(.*?)\]/g, '=$1')
  const parts = str.split(SPLIT_REG_EXP)
  let part
  let i

  for (i = 0; i < parts.length; i++) {
    part = parts[i].trim()

    if (part === undefined || part.length === 0) {
      continue
    }

    this._tokens.push(part)
  }
}

module.exports = JsonPath
