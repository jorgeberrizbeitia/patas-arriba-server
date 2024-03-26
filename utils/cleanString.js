module.exports = (string) => {
  // removes double spaces and converts to lowercase
  // no need to trim as receiving data from FE already does it. Also DB Schema validation does as well.
  return string.replace(/\s{2,}/g, ' ').toLowerCase()
}