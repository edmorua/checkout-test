const {
  getCoupon,
  usedByPatient,
  saveCoupon,
} = require("../parse/ParseCoupon");
const { ERRORSCODE } = require("../utils/Enums");
const { errorResponse } = require("../utils/CustomResponse");
const moment = require("moment");

const validateCoupon = async (
  coupon,
  email,
  mobile,
  transactionType,
  product,
  country,
  finalPrice
) => {
  let validatedCoupon = false;
  try {
    validatedCoupon = await getCoupon(coupon);
    if (validatedCoupon) {
      const couponUsed = await usedByPatient(email, mobile, coupon);
      if (couponUsed === false) {
        validateExpirationDate(validatedCoupon);
        const countryRestriction = validatedCoupon.get("Country_Restriction");
        validateRestriction(countryRestriction, country);
        if (transactionType === "paymentLink") {
          const validInPaymentLink = validatedCoupon.get(
            "Valid_In_Payment_Link"
          );
          if (!validInPaymentLink) {
            throw errorResponse(
              400,
              "coupon not valid for payment-link",
              error.coupon_error
            );
          }
        } else {
          const productRestriction = validatedCoupon.get("Product_Restriction");
          const all = productRestriction.find(element => element.toLowerCase() === 'all');
          if(productRestriction && !all) {
            validateRestriction(productRestriction, product);
          }
        }
        validateUsageLimit(validatedCoupon);
        return applyCoupon(validatedCoupon, finalPrice);
      }
    } else {
      throw errorResponse(
        400,
        "error getting coupon info",
        error.coupon_error
      );
    }
  } catch (error) {
    throw error;
  }
};

const validateExpirationDate = (validatedCoupon) => {
  try {
    const expirationDate = validatedCoupon.get("Expiration_Date");
    if (expirationDate) {
      const validCouponDate = moment(expirationDate).isAfter(new Date());
      if (validCouponDate) {
        return;
      } else {
        throw errorResponse(400, "coupon expired", ERRORSCODE.coupon_error);
      }
    } else {
      return;
    }
  } catch (error) {
    throw error;
  }
};

const validateRestriction = (fieldRestriction, field) => {
  try {
    if (fieldRestriction) {
      const validCoupon = fieldRestriction.find((element) => element === field);
      if (validCoupon) {
        return;
      } else {
        throw errorResponse(
          400,
          `coupon not valid for ${field}`,
          ERRORSCODE.coupon_error
        );
      }
    } else {
      return;
    }
  } catch (error) {
    throw error;
  }
};

const validateUsageLimit = (validatedCoupon) => {
  try {
    const usageLimit = validatedCoupon.get("Usage_Limit");
    let uses = validatedCoupon.get("Uses");
    if (!uses) {
      uses = 0;
    }
    if (usageLimit) {
      const validCouponLimit = usageLimit - uses;
      if (validCouponLimit < 0) {
        throw errorResponse(
          400,
          "coupon reach the usage limit",
          ERRORSCODE.coupon_error
        );
      }
    }
    return;
  } catch (error) {
    throw error;
  }
};

const applyCoupon = async (validatedCoupon, finalPrice) => {
  try {
    if (finalPrice) {
      const discount = validatedCoupon.get("Discount");
      const applyTotal = validatedCoupon.get("Apply_Total");
      const discountType = validatedCoupon.get("Discount_Type");

      if (discountType === "percentage") {
        if (discount > 0 && discount < 100) {
          finalPrice = ((1 - discount / 100) * finalPrice).toFixed(2);
        } else {
          throw errorResponse(
            400,
            "discount percentage not valid",
            ERRORSCODE.coupon_error
          );
        }
      } else {
        if (applyTotal) {
          finalPrice -= discount;
        } else {
          finalPrice = discount;
        }
      }
      finalPrice = parseFloat(finalPrice)
      validatedCoupon = await saveCoupon(validatedCoupon);
      return { finalPrice, validatedCoupon };
    } else {
      throw errorResponse(
        404,
        "final price not found",
        ERRORSCODE.coupon_error
      );
    }
  } catch (error) {
    throw error;
  }
};

const updateCouponUses = async (validatedCoupon) => {
  try {
    if (validatedCoupon) {
      let uses = validatedCoupon.get("Uses");
      if (!uses) {
        uses = 0;
      }
      validatedCoupon.set("Uses", ++uses);
      return validatedCoupon.save();
    } else {
      throw errorResponse(
        error.status ? error.status : 400,
        error.message ? error.message : "error updating coupon uses",
        ERRORSCODE.coupon_error
      );
    }
  } catch (error) {
    console.log("error updating coupon uses");
    throw errorResponse(
      error.status ? error.status : 400,
      error.message ? error.message : "error saving coupon",
      ERRORSCODE.coupon_error
    );
  }
}

module.exports = {
  validateCoupon,
  validateExpirationDate,
  validateRestriction,
  validateUsageLimit,
  updateCouponUses,
  applyCoupon,
};
