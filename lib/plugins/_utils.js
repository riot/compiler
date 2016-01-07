exports = {
  /**
   * Merge two javascript object extending the properties of the first one with
   * the second
   *
   * @param   {object} obj - source object
   * @param   {object} props - extra properties
   * @returns {object} source object containing the new properties
   */
  extend: function _extend (obj, props) {
    for (var prop in props) {
      if (props.hasOwnProperty(prop)) {
        obj[prop] = props[prop]
      }
    }
    return obj
  }
}
