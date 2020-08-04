const {
  errorResponse,
  sucessResponse,
  buildErrorResponse
} = require("./utils/CustomResponse");
const { verifyAuthorization } = require("./utils/BasicAuth");
const { get } = require("./utils/Decode");
const { ERRORSCODE } = require("./utils/Enums");
const { validateCoupon, updateCouponUses } = require("./functions/coupon");
const { validatePaymentLink } = require("./functions/PaymentLink");
const Product = require("./functions/Product");
const { createCardPayment, createOxxoPayment, createPsePayment,createSpeiPayment } = require('./functions/Payment');
const ParsePatient = require('./parse/ParsePatient');
const {notificate} = require('./utils/BotNotification')

const checkoutBackendV2 = async (event) => {
  let authorizationHeader = event.headers.Authorization;
  try {
    console.log("authorizationHeader: ", authorizationHeader);
    verifyAuthorization(authorizationHeader);
    let data = get(event.body);
    if (!data || Object.entries(data).length == 0) {
      return errorResponse(
        404,
        "incomplete data or data not found",
        ERRORSCODE.data_not_found
      );
    }
    data.headers = authorizationHeader
    const response = await handler(data);
    console.log("response: ", JSON.stringify(response));
    return response;
  } catch (error) {
    const data = get(event.body)
    const customerId = data.customerId ? data.customerId : 'N/A';
    const email = data.email ? data.email : 'N/A';
    if(error.body) {
     await notificate(error.body, customerId, email)
    }
    else if(error.message) {
      await notificate(error.message, customerId, email)
    }
    return buildErrorResponse(error);
  }
};

const handler = async (data) => {

  try {
    console.log({body: data})
    const address = data.address ? data.address : null;
    const paymentMethodType = data.paymentMethodType ? data.paymentMethodType : null;
    const installments = data.installments ? data.installments : 1;
    const productKeyName = data.productKeyName ? data.productKeyName : null;
    const paymentLinkKey = data.paymentLinkKey ? data.paymentLinkKey : null;
    const coupon = data.coupon ? data.coupon : null;
    const transactionType = data.transactionType ? data.transactionType : null;
    const country = data.country ? data.country : null;
    const paymentTypeId = data.paymentTypeId ? data.paymentTypeId : null;
    const stripeId = data.stripeId ? data.stripeId : null;
    const conektaId = data.conektaId ? data.conektaId : null;
    const mercadoPagoId = data.mercadoPagoId ? data.mercadoPagoId : null;
    const customerId = data.customerId ? data.customerId : null;
    const isAdvance = data.isAdvance ? data.isAdvance : null;
    const discountPrice = data.discountPrice ?  data.discountPrice : null;
    const nameClient = data.name ? data.name : null;
    const emailClient = data.email ? data.email : null;
    const phoneClient = data.number ? data.number : null;
    const cardType = data.cardType ? data.cardType : null;
    const cookie = data.cookie ? data.cookie : null;
    const payuId = data.payuId ? data.payuId : null;
    const sessionId = data.sessionId ? data.sessionId : null;
    const deviceSessionId = data.deviceSessionId ? data.deviceSessionId : null;
    const pseReference2 = data.docTypePSE? data.docTypePSE: null;
    const pseReference3 = data.docValuePSE? data.docValuePSE: null;
    const userTypePSE = data.userTypePSE ? data.userTypePSE: null;
    const codeBankPSE = data.codeBankPSE ? data.codeBankPSE: null;
    const arrayExtraProducts = data.arrayExtraProducts ? data.arrayExtraProducts : null;
    const source = data.source ? data.source : null;
    const dniValue = data.docValueCard ? data.docValueCard : null;
    const dniType = data.docTypeCard ? data.docTypeCard : null;
    let currency = null;

    if (!nameClient) {
      throw errorResponse(400, 'Name client is required', ERRORSCODE.data_not_found)
    }
    if (!emailClient) {
      throw errorResponse(400, 'Email client is required', ERRORSCODE.data_not_found);
    }
    if (!phoneClient) {
      throw errorResponse(400, 'Phone client is required', ERRORSCODE.data_not_found)
    }
    if (!country) {
      throw errorResponse(400, 'Country is required', ERRORSCODE.data_not_found);
    }
    if (!paymentMethodType) {
      throw errorResponse(400, 'Payment method is required', ERRORSCODE.data_not_found);
    }

    if (!transactionType) {
      throw errorResponse(400, 'transaction type is required', ERRORSCODE.data_not_found);
    }

    if (country === 'México') {
      currency = 'mxn'
    }
    else if (country === 'Colombia') {
      currency = 'cop'
    }
    else if (country === 'Perú') {
      currency = 'pen'
    } 
    else if (country === 'Chile') {
      currency = 'clp'
    }
    else {
      throw errorResponse(400, 'currently only México, Colombia, Chile and Perú are available', ERRORSCODE.country_error)
    }
    let paymentId = null;
    if(customerId) {
      const auxPatient = await ParsePatient.getPatientData(customerId)
      paymentId = auxPatient.paymentId
      console.log({auxPatient})
      if(country !== auxPatient.country.trim()) {
        throw errorResponse(500, 'Patient has different country than the product or paymentLink', ERRORSCODE.country_error)
      }
      if(currency !== auxPatient.currency.toLowerCase()) {
        throw errorResponse(500, 'Patient has different currency than the product or paymentLink', ERRORSCODE.country_error)
      }
    }
    let extraProducts = null;
    let priceOfExtraProducts = 0;
    let priceOfMainProduct = 0;
    if(arrayExtraProducts && arrayExtraProducts.length > 0) {
      const ExtraProducts = await Product.getExtraProductsWithAmount(arrayExtraProducts);
      extraProducts = ExtraProducts.extraProducts;
      priceOfExtraProducts = ExtraProducts.totalPrice;
    }
    let paymentData = {
      nameClient: nameClient,
      emailClient: emailClient,
      phoneClient: phoneClient,
      addressClient: address,
      currency: currency,
      installments: installments,
      cardType: cardType,
      stripeId: stripeId,
      mercadoPagoId: mercadoPagoId,
      conektaId: conektaId,
      country: country,
      address: address,
      paymentTypeId: paymentTypeId,
      customerId: customerId,
      productKeyName: productKeyName,
      paymentLinkKey: paymentLinkKey,
      coupon: coupon,
      cookie : cookie,
      sessionId : sessionId,
      deviceSessionId : deviceSessionId,
      pseReference2 : pseReference2,
      pseReference3 : pseReference3,
      userTypePSE : userTypePSE,
      codeBankPSE : codeBankPSE,
      payuId : payuId,
      paymentId : paymentId,
      extraProducts: extraProducts,
      priceOfExtraProducts: priceOfExtraProducts,
      dniType: dniType,
      dniValue: dniValue
    }
    
    let dataMoons = {isTypeMoons: false, newPatientFinalPrice: null};
    if (transactionType === 'product') {
      const clientData = {
        address,
        installments,
        country,
        customerId,
        isAdvance,
        discountPrice
      }
      const productData = await Product.validateProduct(productKeyName, clientData,source)
      priceOfMainProduct = productData.price
      paymentData = {
        ...paymentData,
        type: 'product',
        paymentName: productData.paymentName,
        description: productData.description,
        stock: productData.stock,
        price: productData.price,
        paymentType: productData.paymentType,
        productFinalPrice: productData.productFinalPrice, // el menor entre el patient final price y product final price
        installmentsType:productData.installmentsType,
        category: productData.category
      }
      const {isTypeMoons, newPatientFinalPrice} = productData
      dataMoons = {isTypeMoons,newPatientFinalPrice}
    }
    else if (transactionType === 'paymentLink') {
      const paymentLinkData = await validatePaymentLink(paymentLinkKey, installments,discountPrice,country)
      priceOfMainProduct = paymentLinkData.price;
      paymentData = {
        ...paymentData,
        type: 'paymentLink',
        paymentType: paymentLinkData.paymentType,
        paymentName: 'PaymentLink: ' + paymentLinkKey,
        description: paymentLinkData.description,
        price: paymentLinkData.price,
        installmentsType: paymentLinkData.installmentsType,
        category: paymentLinkData.category
      },
      paymentData.customerId = paymentLinkData.customerId
      console.log({paymentDataWithPaymentLink : paymentData})
    }
    else {
      throw errorResponse(400, 'No checkout type found', ERRORSCODE.checkout_type_error)
    }
    let validatedCoupon = false;
    console.log({paymentDataWithoutCoupon: paymentData})
    if (coupon) {
      //validar coupon
      if(productKeyName) {
        if(!Product.acceptCoupon(productKeyName)) {
          throw errorResponse(400,'this product does not accept a coupon',ERRORSCODE.coupon_error)
        }
      }
      if(paymentLinkKey) {
        if(!paymentLinkAcceptsCoupon(paymentLinkKey)) {
          throw errorResponse(400,'this paymentLink does not accept a coupon',ERRORSCODE.coupon_error)
        }
      }
      let price = priceOfMainProduct
      if(paymentData.productFinalPrice) {
        if(paymentData.paymentType === 'Payoff') {
          price = priceOfMainProduct;
          const priceBeforCoupon = priceOfMainProduct;
          const couponInfo = await validateCoupon(coupon, emailClient, phoneClient, transactionType, productKeyName, country, price);
          priceOfMainProduct = couponInfo.finalPrice;
          const discountOfCoupon = priceBeforCoupon - priceOfMainProduct;
          paymentData.productFinalPrice = paymentData.productFinalPrice - discountOfCoupon;
          validatedCoupon = couponInfo.validatedCoupon;
          if(dataMoons.isTypeMoons) {
            paymentData.newPatientFinalPrice = paymentData.productFinalPrice;
          }
        }
        else {
          price = paymentData.productFinalPrice
          const couponInfo = await validateCoupon(coupon, emailClient, phoneClient, transactionType, productKeyName, country, price);
          priceOfMainProduct = couponInfo.finalPrice;
          paymentData.productFinalPrice = couponInfo.finalPrice;
          validatedCoupon = couponInfo.validatedCoupon;
          if(dataMoons.isTypeMoons) {
            paymentData.newPatientFinalPrice = couponInfo.finalPrice;
          }
        }
      }
      else {
        const couponInfo = await validateCoupon(coupon, emailClient, phoneClient, transactionType, productKeyName, country, price);
        priceOfMainProduct = couponInfo.finalPrice;
        validatedCoupon = couponInfo.validatedCoupon;
      }
      console.log({paymentDataWithCoupon: paymentData})
    }
    priceOfMainProduct = priceOfMainProduct
    if(priceOfExtraProducts > 0 ) {
      paymentData.price = priceOfExtraProducts + priceOfMainProduct
    }
    else {
      paymentData.price = priceOfMainProduct
    }
    paymentData.priceOfMainProduct = priceOfMainProduct
    let responsePaymentData = null
    if (paymentMethodType === 'card') {
      responsePaymentData = await createCardPayment(paymentData);
    }
    else if (paymentMethodType === 'oxxo') {
      responsePaymentData = await createOxxoPayment(paymentData);
    }
    else if (paymentMethodType === 'spei') {
      responsePaymentData = await createSpeiPayment(paymentData);
    }
    else if (paymentMethodType === 'pse') {
      responsePaymentData = await createPsePayment(paymentData);
    }
    else {
      throw errorResponse(400, 'Only card, oxxo, spei and pse paymentMethodType are available', ERRORSCODE.payment_type_incorrect)
    }

    if (coupon) {
      await updateCouponUses(validatedCoupon);
    }
    console.log({responsePaymentData})
    let amountWithInstallmentsComission = responsePaymentData.amount ? responsePaymentData.amount : null;
    if(country === 'México' || country === 'Colombia' || country === 'Perú') {
      amountWithInstallmentsComission = amountWithInstallmentsComission/100;
    }
    const reference = responsePaymentData.mercadoPagoVerificationCode || responsePaymentData.reference;
    const verificationCode = responsePaymentData.mercadoPagoVerificationCode;
    const mercadoPagoReference = responsePaymentData.mercadoPagoReference ? responsePaymentData.mercadoPagoReference: null;
    const barcode = responsePaymentData.mercadoPagoBarCode || responsePaymentData.barcodeUrl;
    const bank = responsePaymentData.bank ? responsePaymentData.bank : null;
    const clabe = responsePaymentData.clabe ? responsePaymentData.clabe : null;
    const responseMessage = {
      success: true,
      message: 'payment intent successfully done',
      stripePaymentId: responsePaymentData.stripePaymentId,
      conektaPaymentId: responsePaymentData.conektaPaymentId,
      mercadoPagoPaymentId: responsePaymentData.mercadoPagoPaymentId,
      mercadoPagoOxxoUrl: responsePaymentData.mercadoPagoOxxoUrl,
      payuPaymentId: responsePaymentData.payuPaymentId,
      reference,
      verificationCode,
      barcode,
      paymentPrice: paymentData.price,
      amountWithInstallmentsComission: amountWithInstallmentsComission,
      pseLink : responsePaymentData.pseLink,
      mercadoPagoReference,
      bank,
      clabe,
      name : nameClient,
      priceOfExtraProducts,
      priceOfMainProduct,
    }
    console.log({responseMessage})
    return sucessResponse(responseMessage);

  } catch (error) {
    if(error.response){
      throw error.response.data
    }
    throw error;
  }
}

module.exports = {
  checkoutBackendV2,
  handler,
};
