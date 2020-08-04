const { errorResponse } = require("./CustomResponse");

const verifyAuthorization = (authorizationHeader) => {
  if (!authorizationHeader) {
    throw errorResponse(401, "unauthorized", {});
  }

  const encodedCreds = authorizationHeader.split(" ")[1];
  const plainCreds = new Buffer(encodedCreds, "base64").toString().split(":");
  const username = plainCreds[0];
  const password = plainCreds[1];

  if (
    !(
      username === process.env.BASIC_AUTH_USERNAME &&
      password === process.env.BASIC_AUTH_PASSWORD
    )
  ) {
    throw errorResponse(401, "unauthorized", {});
  }
};

const basicAuthHeader = () => {

  const user = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;
  const auth = `${user}:${password}`;
  const authEncoded = `Basic ${Buffer.from(auth).toString('base64')}`;

  return {
    'Authorization': authEncoded,
    'Content-Type': 'application/json'
  }

};

const basicAuthHeaderTest = (user, password) => {

  const auth = `${user}:${password}`;
  const authEncoded = `Basic ${Buffer.from(auth).toString('base64')}`;

  return {
    'Authorization': authEncoded,
    'Content-Type': 'application/json'
  }

};

module.exports = {
  verifyAuthorization,
  basicAuthHeader,
  basicAuthHeaderTest
};
