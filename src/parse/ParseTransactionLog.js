const Parse = require("parse/node");
Parse.serverURL = process.env.PARSE_URL;
Parse.initialize(
  process.env.APP_ID,
  process.env.JAVASCRIPT_KEY,
  process.env.MASTER_KEY
);

/**
 * Save the log of the current payment intetn in te transaction log table
 * @param {*} data 
 */
const saveTransactionLog = async (data) => {
  try {
    const TransactionLog = Parse.Object.extend('TransactionLog');
    const newLog = new TransactionLog();

    newLog.set('nameClient', data.nameClient);
    newLog.set('phoneClient', data.phoneClient);
    newLog.set('emailClient', data.emailClient)
    if (data.paymentStatus) {
      newLog.set('status', data.paymentStatus);
    }
    newLog.set('errorMessage', data.errorMessage);
    if (data.coupon) {
      newLog.set('coupon', data.coupon);
    }
    if (data.stripePaymentId)
      newLog.set('stripePaymentId', data.stripePaymentId);
    if (data.conektaPaymentId)
      newLog.set('conektaPaymentId', data.conektaPaymentId);
    if (data.mercadoPagoPaymentId)
      newLog.set('mercadoPagoPaymentId', data.mercadoPagoPaymentId);
    if (data.payUPaymentId)
      newLog.set('payUPaymentId', data.payUPaymentId);
    if (data.customerId)
      newLog.set('customerId', data.customerId);
    if (data.price)
      newLog.set('price', data.price);
    if (data.reference)
      newLog.set('reference', data.reference);
    if (data.currency)
      newLog.set('currency', data.currency);
    if (data.paymentName)
      newLog.set('paymentName', data.paymentName);
    if (data.paymentMethodType)
      newLog.set('paymentMethodType', data.paymentMethodType);
    if (data.transactionType)
      newLog.set('transactionType', data.transactionType)
    if (data.country)
      newLog.set('country', data.country)
    if (data.mercadoPagoOxxoUrl)
      newLog.set('mercadoPagoOxxoUrl', data.mercadoPagoOxxoUrl)
    if(data.paymentMethodType)
      newLog.set('paymentHandlerType', data.paymentHandlerType)
    if(data.address)
      newLog.set('address',data.address)
    if(data.paymentLinkType)
      newLog.set('paymentLinkType',data.paymentLinkType)

    const result = await newLog.save()
    return result
  } catch (error) {
    console.error('Error while creating TransactionLog: ', error);
    return {
      message: 'Error while creating TransactionLog',
      error: error
    }
  }

}

module.exports = { saveTransactionLog }
