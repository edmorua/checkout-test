const errorBodyResponse = (type, status, code, detail, message) => {

  const body = JSON.stringify({
    type: type,
    status: status,
    code: code,
    detail: detail,
    message: message
  });

  console.log(body);

  return {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": false,
      "Access-Control-Allow-Methods": "*"
    },
    statusCode: status,
    body: body
  };
};

const buildErrorResponse = (err) => {
  console.log(err);
  
  if (err.statusCode) {
    return err;
  } else {
    return errorResponse(500, err.message, {});
  }
}

const errorResponse = (statusCode, message, errorObject) => {
  return errorBodyResponse(
    errorObject.TYPE,
    statusCode,
    errorObject.CODE,
    errorObject.DETAIL,
    message
  );
};

const sucessResponse = async message => {
  message = typeof message != 'string' ? JSON.stringify(message) : message;
  return {
    headers: {
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": false,
      "Access-Control-Allow-Methods": "*"
    },
    statusCode: 200,
    body: message
  };
};

module.exports = {
  errorBodyResponse,
  errorResponse,
  sucessResponse,
  buildErrorResponse
};
