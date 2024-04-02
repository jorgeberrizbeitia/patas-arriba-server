module.exports = (string) => {
  // removes double spaces and converts to lowercase
  // no need to trim. This is done in Schema. Also the strings received in json commonly arrive trimmed.
  return string.replace(/\s{2,}/g, ' ').toLowerCase()
}