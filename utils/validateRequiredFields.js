const validateRequiredFields = (res, ...allFields) => {
  for (let i = 0; i < allFields.length; i++) {
    if (!allFields[i]) {
      console.log("Todos los campos obligatorios deben estar llenos")
      res.status(400).json({ errorMessage: "Todos los campos obligatorios deben estar llenos" });
      return false
    }
  }
  return true
}

module.exports = validateRequiredFields