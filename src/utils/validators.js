const isPositiveIntegerString = (value) => {
  return typeof value === 'string' && /^\d+$/.test(value) && Number(value) > 0;
};

module.exports = {
  isPositiveIntegerString,
};
