const validateMongoIdFormat = (id, res, errorMessage) => {
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  if (!mongoIdRegex.test(id)) {
    res.status(400).json({ errorMessage });
    return false
  } else {
    return true
  }
}

module.exports = validateMongoIdFormat