const { ERRORSCODE } = require("../utils/Enums");
const { errorResponse } = require("../utils/CustomResponse");
const Parse = require('parse/node')

Parse.serverURL = process.env.PARSE_URL
Parse.initialize(
  process.env.APP_ID,
  process.env.JAVASCRIPT_KEY,
)


module.exports = {
  getProduct : async (productKeyName) => {
    try {
      const Product = Parse.Object.extend("Product");
      query = new Parse.Query(Product);
      query.equalTo("keyName", productKeyName);
  
      const product = await query.first();
      if (product) {
        const productName = product.get('name')
        const description = product.get('description')
        const finalPrice = product.get('finalPrice')
        const installments = product.get('installments')
        const currency = product.get('currency')
        const requireAddress = product.get('requireAddress')
        const stock = product.get('stock')
        const type = product.get('type')
        const advancePrice = product.get('price')
        const discountPrice = product.get('discountPrice');
        const installmentsType = product.get('installmentsType');
        const minInstallmentsAmount = product.get('minInstallmentsAmount')
        const isAdvancePayment = product.get('advancePayment');
        const category = product.get('category');
        if(!advancePrice && type === 'moons') {
          throw errorResponse(500,'advancePrice is required', ERRORSCODE.product_error)
        }
        if(!finalPrice) {
          throw errorResponse(500,'final price cannot be null or undefined', ERRORSCODE.product_error)
        }
        if(!currency) {
          throw errorResponse(500,'currency cannot be null or undefined',ERRORSCODE.product_error)
        }
        if(installments && !installmentsType) {
          throw errorResponse(500,'need a installmentsType in product',ERRORSCODE.product_error)
        }
        if(installmentsType === 'discount_one_payment' && (discountPrice === null || discountPrice === undefined)) {
          throw errorResponse(500, 'need a discountPrice',ERRORSCODE.product_error)
        }
        return { 
          productName,
          description,
          finalPrice,
          installments,
          currency,
          requireAddress,
          stock,
          type,
          advancePrice,
          discountPrice,
          installmentsType,
          minInstallmentsAmount,
          isAdvancePayment,
          category
        }
      } else {
        throw errorResponse(
          404,
          "product not found",
          ERRORSCODE.product_not_found
        );
      }
    } catch (error) {
      throw error
    }
  },
  getAcceptCoupon : async (productKeyName) => {
    try {
      const Product = Parse.Object.extend("Product");
      query = new Parse.Query(Product);
      query.equalTo("keyName", productKeyName);
  
      const product = await query.first();
      if (product) {
        const acceptCoupon = product.get('acceptCoupon')
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
}