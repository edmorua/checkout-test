const { ERRORSCODE } = require("../utils/Enums");
const { errorResponse } = require("../utils/CustomResponse");
const Parse = require('parse/node')

Parse.serverURL = process.env.PARSE_URL
Parse.initialize(
  process.env.APP_ID,
  process.env.JAVASCRIPT_KEY,
)


module.exports = {
  getPatientData: async (customerId) => {
    try {
      const Patient = Parse.Object.extend("Patient");
      query = new Parse.Query(Patient);
      query.equalTo("CustomerId", customerId);

      const patient = await query.first();
      if (patient) {
        const finalPrice = patient.get('Final_Price')
        const paidAmount = patient.get('Paid_Amount')
        const paymentStatus = patient.get('Payment_Status')
        const installmentsType = patient.get('Installments_Type')
        const discountPrice = patient.get('Discount_Price');
        const installments = patient.get('Installments');
        const paymentId = patient.get('PaymentId')
        const country = patient.get('Country_Ops');
        const currency = patient.get('Currency');
        if(!paymentId || paymentId === '') {
          throw errorResponse(500,'Patient with not paymentId', ERRORSCODE.patient_error)
        }
        if(installments && (installmentsType === null || installmentsType === undefined || installmentsType === '')) {
          throw errorResponse(500,'Installments Type needed when patient installments is set to true',ERRORSCODE.patient_error);
        }
        if(installmentsType === 'discount_one_payment' && (discountPrice === null || discountPrice === undefined || discountPrice < 0 || discountPrice > 100)) {
          throw errorResponse(500,'Discount price must be a integer between 0 and 100',ERRORSCODE.patient_error);
        }
        if (paymentStatus !== 'No Payment' && paymentStatus !== 'Partial Payment' && paymentStatus !== 'Paid') {
          throw errorResponse(500,'Payment_Status must be either No Payment, Paid or Partial Payment',ERRORSCODE.patient_error)
        }
        if (!country) {
          throw errorResponse(500,'Patient with no Country_Ops',ERRORSCODE.patient_error)

        }
        if(!currency) {
          throw errorResponse(500,'Patient with no currency',ERRORSCODE.patient_error)
        }
        return {
          finalPrice,
          paidAmount,
          paymentStatus,
          installmentsType,
          installments,
          discountPrice,
          paymentId,
          country,
          currency
        }
      } else {
        throw errorResponse(
          404,
          "patient not found",
          ERRORSCODE.patient_not_found
        );
      }
    } catch (error) {
      throw error
    }
  },
}