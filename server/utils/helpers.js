// server/utils/helpers.js
const { validate: uuidValidate } = require('uuid');

function isUUID(uuid) {
  if (typeof uuid !== 'string') {
    return false;
  }
  return uuidValidate(uuid);
}

module.exports = {
  isUUID,
};
