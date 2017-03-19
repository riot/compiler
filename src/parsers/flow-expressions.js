// match "item in items" or "item,i in items"
export const EACH_EXPR = /((\w+)|(?:(\w+),(?:\s+)?(\w+))?)\s+in\s+([\w]+)/i

export const each = {
  start(str, value) {
    const values = value.match(EACH_EXPR)
    const item = values[2] || values[3]
    const target = values[5]
    const iterator = values[4]

    return `${ target }.map(${ iterator ? `(${item}, ${iterator})` : `(${item})`} => { return (`
  },
  end() {
    return '))}'
  }
}

export const conditional = {
  start(str, value) {

  },
  end(str, value) {

  }
}