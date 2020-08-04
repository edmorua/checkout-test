const axios = require('axios');
const { errorResponse } = require('../utils/CustomResponse');
const { basicAuthHeader } = require('../utils/BasicAuth');
const { ERRORSCODE } = require('../utils/Enums')
const { buildMercadoPagoRequest } = require("../utils/MercadoPagoUtils");

/**
 * Function to create a payment intent with stripe
 * @param {*} paymentData 
 */
const createCardStripePayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    const response = await axios.post(process.env.STRIPE_PAYMENT_URL, paymentData, { headers: headers })
    let responsePaymentData = response.data;
    responsePaymentData.paymentHandlerType = "stripe";
    responsePaymentData.stripePaymentId = responsePaymentData.id;
    return { responsePaymentData, error: null };
  } catch (err) {
    if (err.response) {
      console.log('********* STRIPE ERRORR ******')
      console.log(err.response.data)
      const errorData = err.response.data;
      console.log({ errorData })
      const message = errorData.message;
      if (message.status) {
        return { responsePaymentData: null, error: true, message: message.message };
      }
      else {
        return { responsePaymentData: null, error: true, message: message }
      }
    }
    else {
      return {
        responsePaymentData: null,
        error: true,
        message: "couldn't connect to stripe lambda"
      }
    }
  }
}

/**
 * Function to create a payment intent with conekta
 * @param {*} paymentData 
 */
const createCardConektaPayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    const response = await axios.post(process.env.CONEKTA_PAYMENT_URL, paymentData, { headers: headers })
    let responsePaymentData = response.data;
    responsePaymentData.paymentHandlerType = "conekta";
    return { responsePaymentData, error: null };
  } catch (error) {
    if (error.response) {
      console.log('********* CONEKTA ERRORR ******')
      console.log(error.response.data);
      let data = error.response.data;
      if (data.detail) {
        let detail = data.detail
        return { responsePaymentData: null, error: true, message: detail.debug_message };
      }
      if (data.message) {
        return { responsePaymentData: null, error: true, message: data.message }
      }
    }
    else {
      return {
        responsePaymentData: null,
        error: true,
        message: "couldn't connect to conekta lambda"
      }
    }
  }
}

/**
 * Function to create a payment intent with mercado pago
 * @param {*} paymentData 
 */
const createCardMercadoPagoPayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    const request = buildMercadoPagoRequest(paymentData, "card");
    console.log({mercadoPagoRequest: request})
    const response = await axios.post(process.env.MERCADOPAGO_PAYMENT_URL, request, { headers: headers })
    let responsePaymentData = response.data;
    responsePaymentData.paymentHandlerType = "mercadoPago";
    responsePaymentData.mercadoPagoPaymentId = responsePaymentData.body.id.toString();
    responsePaymentData.status = responsePaymentData.body.status;
    return { responsePaymentData, error: null };
  } catch (error) {
    if (error.response) {
      console.log('********* MERCADOPAGO ERRORR ******')
      if (error.response.data) {
        let data = error.response.data;
        console.log(data)
        errorMessage = data.message;
        return { responsePaymentData: null, error: true, message: errorMessage };
      } else {
        return { responsePaymentData: null, error: true, message: error.message }
      }
    }
    else {
      return {
        responsePaymentData: null,
        error: true,
        message: "couldn't connect to mercadoPago lambda"
      }
    }
  }
}

const createCardPayuPayment = async (paymentData) => {
  try {
    console.log({payuPaymentData: paymentData})
    const headers = basicAuthHeader()
    const response = await axios.post(process.env.PAYU_CARD_PAYMENT_URL, paymentData, { headers: headers })
    let responsePaymentData = response.data;
    console.log({payuResponse: responsePaymentData})
    const errorPayu = responsePaymentData.error ? response.error : null;
    const transactionResponse = responsePaymentData.transactionResponse ? responsePaymentData.transactionResponse : null;
    if(errorPayu) {
      throw errorResponse(500,errorPayu,ERRORSCODE.payu_error)
    }
    if(!transactionResponse) {
      throw errorResponse(500,'No transactionResponse found in payu response',ERRORSCODE.payu_error)
    }
    else {
      const state = transactionResponse.state;
      if (state !== 'APPROVED') {
        const errorMessage = transactionResponse.paymentNetworkResponseErrorMessage
        return { responsePaymentData: null, error: true, message: errorMessage }
      }
      responsePaymentData.paymentHandlerType = "payu";
      responsePaymentData.payuPaymentId = transactionResponse.transactionId
      return { responsePaymentData, error: null };
    }
  }catch(error) {
    if(error.response) {
      console.log({errorData: error.response.data})
      let errorData = error.response.data
      if(errorData.message) {
        return { responsePaymentData: null, error: true, message: errorData.message }
      }
      else {
        throw error
      }
    }
    throw error
  }
}


const chileCardPaymetHandler = async (paymentData) => {
  try {
    const responseStripe = await createCardStripePayment(paymentData);
    if(responseStripe.error) {
      throw errorResponse(500,responseStripe.message, ERRORSCODE.stripe_error);
    }
    if(responseStripe.responsePaymentData) {
      return {responsePaymentData: responseStripe.responsePaymentData};
    }

  } catch(error) {
    if(error.response) {
      const responseError = error.response;
      const errorData = responseError.data;
      const errorMessage = errorData.message ? errorData.message : '';
      const errorStatus = responseError.status ? responseError.status : 500;
      throw errorResponse(errorStatus,errorMessage,ERRORSCODE.stripe_error)
    }
    throw error;
  }
}

const peruCardPaymentHandler = async (paymentData) => {
  try {
    const responseStripe = await createCardStripePayment(paymentData);
    if(responseStripe.error) {
      throw errorResponse(500,responseStripe.message, ERRORSCODE.stripe_error);
    }
    if(responseStripe.responsePaymentData) {
      return {responsePaymentData:responseStripe.responsePaymentData};
    }

  } catch(error) {
    if(error.response) {
      const responseError = error.response;
      const errorData = responseError.data;
      const errorMessage = errorData.message ? errorData.message : '';
      const errorStatus = responseError.status ? responseError.status : 500;
      throw errorResponse(errorStatus,errorMessage,ERRORSCODE.stripe_error)
    }
    throw error;
  }
}
const createCardPayment = async (paymentData) => {
  try {
    console.log({ paymentData })
    let responseStripe = null;
    let responseConekta = null;
    let responseMercadoPago = null;
    let responsePayu = null;
    if(paymentData.country === 'Chile') {
      const {responsePaymentData} = await chileCardPaymetHandler(paymentData)
      if(responsePaymentData) {
        return responsePaymentData;
      }
      else {
        throw errorResponse(404,'No response payment data found in chile card payment handler',ERRORSCODE.data_not_found);
      }
    }
    if(paymentData.country === 'Perú') {
      const {responsePaymentData} = await peruCardPaymentHandler(paymentData)
      if(responsePaymentData) {
        return responsePaymentData;
      }
      else {
        throw errorResponse(404,'No response payment data found in peru card payment handler',ERRORSCODE.data_not_found);
      }
    }
    if(paymentData.country === 'Perú')
    if(paymentData.country === 'Colombia') {
      if (paymentData.mercadoPagoId) {
        responseMercadoPago = await createCardMercadoPagoPayment(paymentData);
        if (!responseMercadoPago.error && responseMercadoPago.responsePaymentData) {
          console.log('***** RESPONSE MERCADOPAGO ****')
          console.log(responseMercadoPago)
          return responseMercadoPago.responsePaymentData
  
        }
      }
      if(paymentData.payuId) {
        responsePayu = await createCardPayuPayment(paymentData);
        if (!responsePayu.error && responsePayu.responsePaymentData) {
          console.log('***** RESPONSE PAYU ****')
          console.log(responsePayu)
          return responsePayu.responsePaymentData
        }
      }
      /*
      if(paymentData.stripeId) {
        responseStripe = await createCardStripePayment(paymentData);
        if (!responseStripe.error && responseStripe.responsePaymentData) {
          console.log('***** RESPONSE STRIPE ****')
          console.log(responseStripe)
          return responseStripe.responsePaymentData
        }
      }
      */ 
      else {
        throw errorResponse(400,'Error with the tokens for colombia',ERRORSCODE.payment_gateway_error)
      }
    }
    else {
      if(paymentData.installments && paymentData.installments > 1) {
        if (paymentData.stripeId) {
          responseStripe = await createCardStripePayment(paymentData);
          if (!responseStripe.error && responseStripe.responsePaymentData) {
            console.log('***** RESPONSE STRIPE ****')
            console.log(responseStripe)
            return responseStripe.responsePaymentData
          }  
        }
        else {
          throw errorResponse(400,'Installments only available for stripe at the moment',ERRORSCODE.installments_error)
        }
      }
      else {
        if (paymentData.stripeId) {
          responseStripe = await createCardStripePayment(paymentData);
          if (!responseStripe.error && responseStripe.responsePaymentData) {
            console.log('***** RESPONSE STRIPE ****')
            console.log(responseStripe)
            return responseStripe.responsePaymentData
          }
        }
        if (paymentData.mercadoPagoId) {
          responseMercadoPago = await createCardMercadoPagoPayment(paymentData);
          if (!responseMercadoPago.error && responseMercadoPago.responsePaymentData) {
            console.log('***** RESPONSE MERCADOPAGO ****')
            console.log(responseMercadoPago)
            return responseMercadoPago.responsePaymentData
    
          }
        }
        if (paymentData.conektaId) {
          responseConekta = await createCardConektaPayment(paymentData);
          if (!responseConekta.error && responseConekta.responsePaymentData) {
            console.log('***** RESPONSE CONEKTA ****')
            console.log(responseConekta)
            return responseConekta.responsePaymentData;
          }
        }
        if(!paymentData.stripeId && !paymentData.mercadoPagoId && !paymentData.conektaId) {
          throw errorResponse(400,'Only stripe, conekta and mercado pago are available for payment gateways',ERRORSCODE.payment_gateway_error)
        }
      }
    }

    let stripeMessage = null;
    let conektaMessage = null;
    let mercadoPagoMessage = null;
    let payuMessage = null;
    if (responseStripe) {
      stripeMessage = responseStripe.message ? responseStripe.message : null;
    }
    if (responseConekta) {
      conektaMessage = responseConekta.message ? responseConekta.message : null;
    }
    if (responseMercadoPago) {
      mercadoPagoMessage = responseMercadoPago.message ? responseMercadoPago.message : null;
    }
    if(responsePayu && responsePayu.error) {
      payuMessage = responsePayu.message ? responsePayu.message: null;
    }
    const message = {
      success: false,
      message: stripeMessage || conektaMessage || mercadoPagoMessage || payuMessage,
      stripeMessage,
      conektaMessage,
      mercadoPagoMessage,
      payuMessage
    }
    throw errorResponse(400, message, ERRORSCODE.process_payment_error)

  } catch (error) {
    throw error;
  }
}

const createOxxoConektaPayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    const response = await axios.post(process.env.CONEKTA_OXXO_PAYMENT_URL, paymentData, { headers: headers })
    let responsePaymentData = response.data;
    return { responsePaymentData, error: null };
  } catch (error) {
    if (error.response) {
      let data = error.response.data;
      if (data.detail) {
        let detail = data.detail
        return { responsePaymentData: null, error: true, message: detail.debug_message };
      }
      if (data.message) {
        return { responsePaymentData: null, error: true, message: data.message }
      }
    }
    else {
      return {
        responsePaymentData: null,
        error: true,
        message: "couldn't connect to conekta lambda"
      }
    }
  }
}
const createOxxoPayment = async (paymentData) => {
  try {
    console.log({OxxoPaymentData: paymentData})

    let responseConekta = await createOxxoConektaPayment(paymentData)
    if (!responseConekta.error && responseConekta.responsePaymentData)
      return responseConekta.responsePaymentData;
    
    let responseMercadoPago = await createOxxoMercadoPagoPayment(paymentData);
    if (!responseMercadoPago.error && responseMercadoPago.responsePaymentData)
      return responseMercadoPago.responsePaymentData;
  
    
    let conektaMessage = responseConekta.message? responseConekta.message : null;
    let mercadoPagoMessage = responseMercadoPago.message? responseMercadoPago.message : null;
    const message = {
      success: false,
      message: conektaMessage || mercadoPagoMessage,
      conektaMessage,
      mercadoPagoMessage,
    }
    console.log({message})
    throw errorResponse(400, message, ERRORSCODE.process_payment_error)

  } catch (error) {
    throw error;
  }

}

const createOxxoMercadoPagoPayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    console.log({paymentData});
    const request = buildMercadoPagoRequest(paymentData, "oxxo");
    console.log({request});
    const response = await axios.post(process.env.MERCADOPAGO_PAYMENT_URL, request, { headers: headers })
    let responsePaymentData = response.data;
    console.log({responseMercadoPagoOxxo: responsePaymentData})
    console.log({transaction_details:responsePaymentData.body.transaction_details })
    console.log({barcode: responsePaymentData.body.barcode})
    responsePaymentData.paymentHandlerType = "mercadoPago";
    responsePaymentData.mercadoPagoPaymentId = responsePaymentData.body.id.toString();
    responsePaymentData.status = responsePaymentData.body.status;
    responsePaymentData.mercadoPagoOxxoUrl = responsePaymentData.body.transaction_details.external_resource_url;
    responsePaymentData.mercadoPagoReference = responsePaymentData.body.transaction_details.payment_method_reference_id;
    responsePaymentData.mercadoPagoVerificationCode = responsePaymentData.body.transaction_details.verification_code;
    responsePaymentData.mercadoPagoBarCode = responsePaymentData.body.barcode;
    return { responsePaymentData, error: null };
  } catch (error) {
    if (error.response) {
      let errorMessage;
      let mercadoPagoPaymentId;
      if (error.response.data) {
        let data = error.response.data;
        console.log({MercadoPagoError: data})
        errorMessage = data.message;
        mercadoPagoPaymentId = errorMessage.id ? errorMessage.id : null;
        mercadoPagoPaymentErrorMessage = errorMessage.message ?  errorMessage.message : null;
        return { responsePaymentData: null, error: true, message: errorMessage };
      } else {
        return { responsePaymentData: null, error: true, message: error.message }
      }
    }
    else {
      return {
        responsePaymentData: null,
        error: true,
        message: "couldn't connect to mercadoPago lambda"
      }
    }
  }
}

const createPsePayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    console.log({paymentDataPSE : paymentData});
    const response = await axios.post(process.env.PAYU_PSE_PAYMENT_URL,paymentData, {headers: headers});
    console.log(response.data);
    let responsePaymentData = response.data;
    responsePaymentData.paymentHandlerType = "payu";
    const {transactionResponse} = responsePaymentData
    const extraParameters = transactionResponse.extraParameters ? transactionResponse.extraParameters : null;
    const {responseCode,paymentNetworkResponseErrorMessage} = transactionResponse;
    if(responseCode === 'INVALID_TRANSACTION') {
      if(paymentNetworkResponseErrorMessage) {
        throw errorResponse(500,paymentNetworkResponseErrorMessage,ERRORSCODE.payu_error);
      }
      else {
        throw errorResponse(500, 'Something went wrong with payu please check later',ERRORSCODE.payu_error)
      }
    }
    if(extraParameters) {
      responsePaymentData.pseLink = extraParameters.BANK_URL ? extraParameters.BANK_URL: null;
      if(!responsePaymentData.pseLink) {
        throw errorResponse(500,"Couldn't find the BANK_URL in the payu response",ERRORSCODE.payu_error)
      }
      return responsePaymentData;
    }
  } catch(error) {
    if(error.response) {
      let errorData = error.response.data;
      let status = error.response.status;
      console.log('***** PAYU ERROR *******');
      console.log(errorData);
      let errorMessage = errorData.message;
      throw errorResponse(status,errorData.message,ERRORSCODE.payu_error);
    }
    else {
      console.log(error)
      throw error
    }
  }
}

const createSpeiPayment = async (paymentData) => {
  try {
    const headers = basicAuthHeader();
    console.log({paymentDataSpei : paymentData});
    const response = await axios.post(process.env.CONEKTA_SPEI_URL,paymentData, {headers: headers});
    console.log(response.data);
    let responsePaymentData = response.data;
    responsePaymentData.paymentHandlerType = "conekta";
    return responsePaymentData;
  } catch(error) {
    if(error.response) {
      let errorData = error.response.data;
      let status = error.response.status;
      console.log('***** CONEKTA ERROR *******');
      console.log(errorData);
      let errorMessage = errorData.message;
      throw errorResponse(status,errorData.message,ERRORSCODE.conekta_error);
    }
    else {
      console.log(error)
      throw error
    }
  }
}

module.exports = {
  createCardPayment,
  createOxxoPayment,
  createOxxoMercadoPagoPayment,
  createPsePayment,
  createSpeiPayment,
}