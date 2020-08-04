const { ERRORSCODE } = require("../utils/Enums");
const { errorResponse } = require("../utils/CustomResponse");
const Parse = require('parse/node')

Parse.serverURL = process.env.PARSE_URL
Parse.initialize(
  process.env.APP_ID,
  process.env.JAVASCRIPT_KEY,
)

const getPaymentLink = async (paymentKey) => {
  try {
    const Product = Parse.Object.extend("PaymentLink");
    query = new Parse.Query(Product);
    query.equalTo("paymentKey", paymentKey);

    const paymentLink = await query.first();
    if (paymentLink) {
      const finalPrice = paymentLink.get('finalPrice')
      const customerId = paymentLink.get('customerId')
      const installments = paymentLink.get('installments')
      const description = paymentLink.get('description')
      const installmentsType = paymentLink.get('installmentsType');
      const discountPrice = paymentLink.get('discountPrice');
      const category = paymentLink.get('category');
      const paymentLinkCountry = paymentLink.get('countryOps');
      if (!finalPrice) {
        throw errorResponse(400,"price is required", ERRORSCODE.price_required)
      }
      if (!customerId) {
        throw errorResponse(400,"customerId is required", ERRORSCODE.customer_id_required)
      }
      if(installments && !installmentsType) {
        throw errorResponse(500,'need a installmentsType in paymentLink',ERRORSCODE.payment_link_error)
      }
      if(installmentsType === 'discount_one_payment' && (discountPrice === null || discountPrice === undefined)) {
        throw errorResponse(500, 'need a discountPrice',ERRORSCODE.product_error)
      }
      return {
        paymentLinkPrice: finalPrice,
        installmentsType,
        paymentLinkDiscountPrice:discountPrice, 
        customerId, 
        installments, 
        description,
        category,
        paymentLinkCountry
      }
    } else {
      throw errorResponse(
        404,
        "payment link not found",
        ERRORSCODE.payment_link_not_found
      );
    }
  } catch (error) {
    throw error
  }
};

const getDealByCustomerId = async (customerId) => {
    try {
      const Patient = Parse.Object.extend("Patient");
      query = new Parse.Query(Patient);
      query.equalTo("CustomerId", customerId);
      const firstDeal = await query.first();
      if (firstDeal) {
        const finalPrice = firstDeal.get('Final_Price');
        const paidAmount = firstDeal.get('Paid_Amount');
        const paymentStatus = firstDeal.get('Payment_Status');

        if (!finalPrice) {
          throw errorResponse(400, "finalPrice is required", ERRORSCODE.final_price_required)
        }
        if (paidAmount === undefined) {
          throw errorResponse(400, "paidAmount is required", ERRORSCODE.paid_amount_required)
        }

        return { finalPrice, paidAmount,paymentStatus }
      } else {
        throw errorResponse(
          404,
          "Patient not found",
          ERRORSCODE.patient_not_found
        );
      }
    } catch (error) {
      throw error
    }
};


const getAcceptCoupon = async (paymentKey) => {
  try {
    const PaymentLink = Parse.Object.extend("PaymentLink");
    query = new Parse.Query(PaymentLink);
    query.equalTo("paymentKey", paymentKey);

    const paymentLink = await query.first();
    if (paymentLink) {
      const acceptCoupon = paymentLink.get('acceptCoupon')
      return {acceptCoupon}
    }
    else {
      throw errorResponse(
        400,
        'product not found',
        ERRORSCODE.product_not_found
      )
    }
  } catch(error) {
    throw error
  }
}

module.exports = {getPaymentLink, getDealByCustomerId, getAcceptCoupon}