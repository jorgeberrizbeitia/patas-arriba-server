module.exports = (string) => {
  console.log(string)
  return string.replace(/\s{2,}/g, ' ').toLowerCase()
}