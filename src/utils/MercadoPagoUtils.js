const buildMercadoPagoRequest = (paymentData, paymentMethodType) => {

  let areaCode;
  let request = null;
  const allName = paymentData.nameClient.split(" ");
  let name = "";
  let lastname = "";
  if(allName.length === 3) {
    name = allName[0]
    lastname = allName[1] + allName[2]
  }
  else if(allName.length === 2) {
    name = allName[0]
    lastname = allName[1]
  }
  else if(allName.length === 1) {
    name =  allName[0]
    lastname = ""
  }
  else {
    name = ""
    lastname = ""
  }

  if (paymentData.country === 'México') {
    areaCode = "52";
    request = {
      payer: {
        email: paymentData.emailClient,
        first_name: name,
        last_name: lastname
      },
      additional_info: {
        payer: {
          first_name: name,
          last_name: lastname,
          phone: {
            area_code: areaCode,
            number: paymentData.phoneClient ? paymentData.phoneClient.toString() : "",
          }
        }
      },
      transaction_amount: paymentData.price,
      installments: paymentData.installments,
      description: paymentData.description,
      country: paymentData.country,
      paymentLinkKey: paymentData.paymentLinkKey,
      productKeyName: paymentData.productKeyName,
      customerId: paymentData.customerId,
      coupon: paymentData.coupon,
      paymentType: paymentData.paymentType,
      productFinalPrice: paymentData.productFinalPrice
    }
  }
  else if (paymentData.country === 'Colombia') {
    areaCode = "57";
    request = {
      payer: {
        email: paymentData.emailClient,
        first_name: name,
        identification : {
          type: paymentData.dniType,
          number: paymentData.dniValue,
        }
      },
      additional_info: {
        payer: {
          first_name: name,
          phone: {
            area_code: areaCode,
            number: paymentData.phoneClient ? paymentData.phoneClient.toString() : "",
          }
        }
      },
      transaction_amount: paymentData.price,
      installments: paymentData.installments,
      description: paymentData.description,
      country: paymentData.country,
      paymentLinkKey: paymentData.paymentLinkKey,
      productKeyName: paymentData.productKeyName,
      customerId: paymentData.customerId,
      coupon: paymentData.coupon,
      paymentType: paymentData.paymentType,
      productFinalPrice: paymentData.productFinalPrice
    }
  }


  console.log({name})
  console.log({lastname})

  if (paymentMethodType == "oxxo") {
    request = {
      ...request,
      payment_method_id: paymentMethodType
    };
  } else {
    request = {
      ...request, token: paymentData.mercadoPagoId,
      payment_method_id: paymentData.cardType
    };
  }

  return request;
};


module.exports = {
  buildMercadoPagoRequest
};
