const { ERRORSCODE } = require("../utils/Enums");
const { errorResponse } = require("../utils/CustomResponse");
const { getPaymentLink, getDealByCustomerId, getAcceptCoupon } = require ("../parse/parsePaymentLink")

const validatePaymentLink = async (paymentKey, clientInstallments,discountPrice, country) => {
   console.log('validatePaymentLink', paymentKey)
  if (paymentKey && paymentKey !== '') {
    try {
      let {
        paymentLinkPrice,
        customerId,
        installments,
        description,
        installmentsType,
        paymentLinkDiscountPrice,
        category,
        paymentLinkCountry
      } = await getPaymentLink(paymentKey);
      const Patient = await getDealByCustomerId(customerId);
      let paymentType = null;
      if(country !== paymentLinkCountry.trim()) {
        throw errorResponse(500,"paymentLink Country different to country of the request", ERRORSCODE.over_price)
      }
      if(Patient.paymentStatus === 'Paid') {
        throw errorResponse(400,"Patient with payment status in Paid", ERRORSCODE.over_price)
      }
      if(Patient.paymentStatus === 'Partial Payment') {
        if(!Patient.paidAmount) {
          throw errorResponse(400,"Patient with payment status Partial Payment and has no Paid_Amount", ERRORSCODE.over_price)
        }
        const remaining = Patient.finalPrice - Patient.paidAmount;
        if(paymentLinkPrice > remaining) {
          throw errorResponse(400,"Price in paymentlink is over the amount necessary for payoff", ERRORSCODE.over_price)
        }
        if(paymentLinkPrice === remaining) {
          paymentType = 'Payoff';
        }
        if(paymentLinkPrice < remaining) {
          paymentType = 'Partial';
        }
      }
      if(Patient.paymentStatus === 'No Payment') {
        if(Patient.paidAmount && Patient.paidAmount > 0) {
          throw errorResponse(400,"Patient with payment status No Payment and has Paid Amount greater than zero", ERRORSCODE.over_price)
        }
        if(paymentLinkPrice > Patient.finalPrice) {
          throw errorResponse(400,"Price in paymentlink is over the amount necessary for payoff", ERRORSCODE.over_price)
        }
        if(paymentLinkPrice === Patient.finalPrice) {
          paymentType = 'Complete';
        }
        if(paymentLinkPrice < Patient.finalPrice) {
          paymentType = 'Partial';
        }
      }
      if (clientInstallments && clientInstallments > 1) {
        if(!installments) {
          throw errorResponse(400,"Installments are not possible in this product", ERRORSCODE.installments_error)
        }
        if(installmentsType !== 'apply_to_price' && installmentsType !== 'discount_one_payment') {
          throw errorResponse(500,'Error in InstallmentsType only discount_one_payment and apply_to_price available',ERRORSCODE.installments_error)
        }
      }
      if(discountPrice && (paymentLinkDiscountPrice === null || paymentLinkDiscountPrice === undefined || paymentLinkDiscountPrice < 0)) {
        throw errorResponse(500,'Product does not have discount price or is less to zero',ERRORSCODE.product_error)
      }
      if(discountPrice && installmentsType === 'discount_one_payment') {
        paymentLinkPrice = (1 -(paymentLinkDiscountPrice/100))*paymentLinkPrice
      }
      return {customerId, paymentType, price : paymentLinkPrice, description, installmentsType:installmentsType,category }
    } catch (error) {
      throw error
    } 
  } else {
    throw errorResponse(
      404,
      "payment key not found",
      ERRORSCODE.payment_key_not_found
    );
  }
};

const acceptCoupon = async (paymentKey) => {
  try {
    const acceptCoupon = await getAcceptCoupon(paymentKey);
    if(acceptCoupon) {
      return true
    }
    else {
      return false
    }
  } catch(error) {
    throw error
  }
}
module.exports = { validatePaymentLink, acceptCoupon };