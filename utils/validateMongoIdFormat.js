const validateMongoIdFormat = (id, res, errorMessage) => {
  //todo put res as first argument
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/
  if (!mongoIdRegex.test(id)) {
    console.log("mongo id invalido")
    res.status(400).json({ errorMessage });
    return false
  } else {
    return true
  }
}

module.exports = validateMongoIdFormat