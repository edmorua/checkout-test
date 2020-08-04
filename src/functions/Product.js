const { ERRORSCODE } = require("../utils/Enums");
const { errorResponse } = require("../utils/CustomResponse");
const ParseProduct = require('../parse/parseProduct');
const ParsePatient = require('../parse/ParsePatient.js')


const getCustomerMoonsData = async ({
  customerId,
  productPrice,
  isAdvance,
  advancePrice,
  productInstallmentsType,
  discountPrice,
  productDiscountPrice,
  productMinInstallmentsAmount,
  installmentsSelected,
  isAdvancePayment,
  source,
  productHasInstallments,
}) => {
  if(source && source !== 'organic') {
    if(!customerId) {
      throw errorResponse(400,"CustomerId is required", ERRORSCODE.data_not_found)
    }
  }
  
  const patient = await ParsePatient.getPatientData(customerId);
  let newPrice = null;
  let newPatientFinalPrice = null;
  let paymentType = null;
  let installmentsType = null;
  let discountToPrice = null;
  let minInstallmentsAmount = null;
  let hasInstallments = false
  console.log({patient})
  if(patient.installments) {
    installmentsType = patient.installmentsType
    discountToPrice = patient.discountPrice
    hasInstallments = true
    minInstallmentsAmount = 3000;
  } else {
    installmentsType = productInstallmentsType
    discountToPrice = productDiscountPrice
    minInstallmentsAmount = productMinInstallmentsAmount
    hasInstallments = productHasInstallments
  }
  if(installmentsSelected && installmentsSelected > 1) {
    if(!hasInstallments ) {
      throw errorResponse(400,"Installments are not possible in this product or patient", ERRORSCODE.installments_error)
    }
    if(!installmentsType || installmentsType === '') {
      throw errorResponse(50,'Installments Type is required in product with installments selected',ERRORSCODE.installments_error)
    }
    if(installmentsType === 'discount_one_payment' && discountPrice && (discountPrice === null || discountPrice === undefined || discountPrice < 0)) {
      throw errorResponse(500,'Product does not have discount price or is less to zero',ERRORSCODE.product_error)
    }
  }
  console.log({installmentsType: installmentsType})
  newPatientFinalPrice = patient.finalPrice
  if(patient.paymentStatus === 'Paid') {
    throw errorResponse(500,'Patient already paid the product',ERRORSCODE.patient_error)
  }
  else if (patient.paymentStatus === 'Partial Payment') {
    let newFinalPrice = patient.finalPrice;
    newPrice = newFinalPrice - patient.paidAmount;
    if(patient.paidAmount === 0) {
      throw errorResponse(500,'Partial Payment with 0 paid amount', ERRORSCODE.patient_error)
    }
    else {
      paymentType = 'Payoff'
      if(installmentsType === 'discount_one_payment' && discountPrice) {
        newPrice = (1 - (discountToPrice/100)) * newPrice;
        newPatientFinalPrice = newPrice + patient.paidAmount;
      }
    }
    if(newPrice <= 0) {
      throw errorResponse(500,'Patient does not have anything to paid', ERRORSCODE.patient_error)
    }
  }
  else if (patient.paymentStatus === 'No Payment') {
    if (patient.paidAmount > 0) {
      throw errorResponse(500,'Paid amount greater than zero with payment_status equal to No Payment',ERRORSCODE.patient_error)
    }
    let productFinalPrice = productPrice;
    if(isAdvancePayment) {
      paymentType = 'Partial'
      productFinalPrice = patient.finalPrice;
      newPrice = productPrice < patient.finalPrice ? productPrice: patient.finalPrice;
      newPatientFinalPrice = patient.finalPrice;
    }
    else {
      if(productFinalPrice > patient.finalPrice) {
        newPrice = patient.finalPrice;
        paymentType = 'Complete'
      } else {
        paymentType = 'Complete'
        newPrice = productFinalPrice;
        newPatientFinalPrice = productFinalPrice
      }
      if(isAdvance) {
        paymentType = 'Partial'
        newPrice = advancePrice;
      }
      if(installmentsType === 'discount_one_payment'  && discountPrice) { 
        newPrice = (1 - (discountToPrice/100)) * newPrice;
        newPatientFinalPrice = newPrice;
      }
    }
  }
  else {
    throw errorResponse(500,'Patient with wrong payment status, please check', ERRORSCODE.patient_error)
  }
  if(installmentsSelected && installmentsSelected > 1) {
    if(newPrice < minInstallmentsAmount) {
      throw errorResponse(500,'Price to charge with installments is less than the minimun amount need it to this type of payment',ERRORSCODE.installments_error)
    }
  }
  console.log({customerPrice:newPrice, newPatientFinalPrice: newPatientFinalPrice, paymentType: paymentType, installmentsType})

  return {newPrice, newPatientFinalPrice,paymentType,patientinstallmentsType:installmentsType};
}

/**
 * 
 * @param {String} productKeyName - the key name of the product to search in DB.
 * @param {String} clientData - the client data needed to verify with the conditions of the product to buy.
 */
const validateProduct = async (productKeyName,clientData,source) => {
  try{
    console.log({productKeyName})
    const {address,installments,country,customerId, isAdvance, discountPrice} = clientData
    if(!productKeyName || productKeyName === '') {
      throw errorResponse(400,"Product key not found", ERRORSCODE.product_key_not_found)
    }
    const product = await ParseProduct.getProduct(productKeyName)
    const installmentsType = product.installmentsType;
    if(product.stock && product.stock === 0) {
      throw errorResponse(400,"There are no products left", ERRORSCODE.stock_error)
    }
    if(country === 'México' && product.currency !== 'MXN'){
      throw errorResponse(400,'product not valid in México', ERRORSCODE.product_error)
    }
    if(country === 'Colombia' && product.currency !== 'COP'){
      throw errorResponse(400,'product not valid in Colombia',ERRORSCODE.product_error)
    }
    if(country === 'Perú' && product.currency !== 'PEN') {
      throw errorResponse(400,'product not valid in Perú',ERRORSCODE.product_error)
    }
    if(country === 'Chile' && product.currency !== 'CLP') {
      throw errorResponse(400,'product not valid in Chile',ERRORSCODE.product_error)

    }
    if(product.requireAddress && !address) {
      throw errorResponse(400,"Address is require", ERRORSCODE.address_is_require)
    }
    
    let price = product.finalPrice
    let paymentType = 'complete'
    let data = null;
    if(product.type === 'moons') {
      console.log({product})
      const dataAux = {
        customerId,
        productPrice : product.finalPrice,
        isAdvance: isAdvance,
        advancePrice: product.advancePrice,
        productInstallmentsType: installmentsType,
        discountPrice: discountPrice,
        productDiscountPrice: product.discountPrice,
        productMinInstallmentsAmount: product.minInstallmentsAmount,
        installmentsSelected: installments,
        productHasInstallments: product.installments,
        isAdvancePayment : product.isAdvancePayment,
      }
      const {newPrice,newPatientFinalPrice,paymentType,patientinstallmentsType} = await getCustomerMoonsData(dataAux);
      let productFinalPrice = product.finalPrice;
      if(newPatientFinalPrice) {
        productFinalPrice = newPatientFinalPrice
      }
      data = {
        paymentName: product.productName,
        description: product.description,
        price: newPrice,
        stock: product.stock,
        currency: product.currency,
        newPatientFinalPrice : newPatientFinalPrice,
        isTypeMoons: true,
        paymentType: paymentType,
        productFinalPrice: productFinalPrice,
        installmentsType:patientinstallmentsType,
        category : product.category
      }
    }
    else {
      if(installments && installments > 1){
        if(!product.installments ) {
          throw errorResponse(400,"Installments are not possible in this product", ERRORSCODE.installments_error)
        }
        if(!product.installmentsType || product.installmentsType === '') {
          throw errorResponse(50,'Installments Type is required in product with installments selected',ERRORSCODE.installments_error)
        }
        if(product.installmentsType === 'discount_one_payment' && discountPrice && (product.discountPrice === null || product.discountPrice === undefined || product.discountPrice < 0)) {
          throw errorResponse(500,'Product does not have discount price or is less to zero',ERRORSCODE.product_error)
        }
      }
      if (isAdvance) {
        price = product.advancePrice
        if(!price) {
          throw errorResponse(400,'This product does not have and advance price', ERRORSCODE.product_error)
        }
        paymentType = 'partial'
      }
      data = {
        paymentName : product.productName,
        description : product.description,
        price : price,
        stock : product.stock,
        currency : product.currency,
        isTypeMoons: false,
        newPatientFinalPrice: null,
        paymentType: paymentType,
        productFinalPrice: product.finalPrice,
        installmentsType:installmentsType,
        category: product.category
      }
    }
    console.log({ProductData:data})
    return data
    
  }catch(error){
    console.error(error)
    throw error
  }
};

const acceptCoupon = async (productKeyName) => {
  try {
    const product = await ParseProduct.getAcceptCoupon(productKeyName);
    if(product.acceptCoupon) {
      return true
    }
    else {
      return false
    }
  } catch(error) {
    throw error
  }
}

const getExtraProductsWithAmount = async (arrayExtraProducts) => {
  try {
    let totalPrice = 0;
    let extraProducts = [];
    console.log({arrayExtraProducts})
    for ( let i = 0; i < arrayExtraProducts.length; i++) {
      if(!arrayExtraProducts[i].productKeyName || arrayExtraProducts[i].productKeyName === '' ) {
        throw errorResponse(400,`Couldn't find the product with ${arrayExtraProducts[i].productKeyName} keyname`,ERRORSCODE.product_error)
      }
      if(!arrayExtraProducts[i].quantity) {
        throw errorResponse(400,`Couldn't find the quantity or quantity is zero of the ${i}'th product`,ERRORSCODE.product_error)
      }
      const extraProduct = await ParseProduct.getProduct(arrayExtraProducts[i].productKeyName);
      let priceOfAmount = extraProduct.finalPrice*arrayExtraProducts[i].quantity;
      totalPrice += priceOfAmount
      extraProducts.push({
        name: extraProduct.productName,
        description: extraProduct.description,
        productKeyName: arrayExtraProducts[i].productKeyName,
        quantity: arrayExtraProducts[i].quantity
      })
    }
    return {extraProducts,totalPrice}
  } catch (error) {
    throw error
  }
}

module.exports = { validateProduct, acceptCoupon, getExtraProductsWithAmount };