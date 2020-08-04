const { ERRORSCODE } = require("../utils/Enums");
const {
  errorResponse,
} = require("../utils/CustomResponse");
const Parse = require("parse/node");

Parse.serverURL = process.env.PARSE_URL;
Parse.initialize(
  process.env.APP_ID,
  process.env.JAVASCRIPT_KEY,
  process.env.MASTER_KEY
);

const getCoupon = async (coupon) => {
  const Coupon = Parse.Object.extend("Coupon");
  const query = new Parse.Query(Coupon);
  query.equalTo("Code", coupon);
  let res = false;
  try {
    res = await query.first();
  } catch (error) {
    throw errorResponse(
      error.status ? error.status : 400,
      error.message ? error.message : "error getting coupon",
      ERRORSCODE.coupon_error
    );
  }
  if (res) {
    return res;
  } else {
    console.log("coupon-not-valid");
    throw errorResponse(400, "coupon not valid", ERRORSCODE.coupon_error);
  }
};

const usedByPatient = async (email, mobile, coupon) => {
  const TransactionLog = Parse.Object.extend("TransactionLog");
  const queryEmail = new Parse.Query(TransactionLog);
  queryEmail.equalTo("Email_Client", email);

  const queryPhone = new Parse.Query(TransactionLog);
  queryPhone.equalTo("Phone_Client", mobile);

  var mainQuery = Parse.Query.or(queryPhone, queryEmail);
  mainQuery.equalTo("Coupon", coupon);

  let response = false;
  try {
    response = await mainQuery.first();
    if (response) {
      console.log("already-used");
      throw errorResponse(400, "coupon already used", ERRORSCODE.coupon_error);
    } else {
      return false;
    }
  } catch (error) {
    throw errorResponse(
      error.status ? error.status : 400,
      error.message
        ? error.message
        : "coupon already used",
      ERRORSCODE.coupon_error
    );
  }
};

const saveCoupon = async (coupon) => {
  try {
    return await coupon.save();
  } catch (error) {
    console.log("coupon-not-saved");
    throw errorResponse(
      error.status ? error.status : 400,
      error.message ? error.message : "error saving coupon",
      ERRORSCODE.coupon_error
    );
  }
};


module.exports = { getCoupon, usedByPatient, saveCoupon };
