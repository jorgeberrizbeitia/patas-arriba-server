const validateDateFormat = (res, date, errorMessage) => {
  let dateFormatted = new Date(date)
  if (isNaN(dateFormatted)) {
    console.log("formato de fecha invalido")
    res.status(400).json({ errorMessage });
    return false
  } else {
    return true
  }
}

module.exports = validateDateFormat