# checkout-backend-v2
checkout serverless backend v2

# Endpoint 
***Post - https://dev.moons.rocks/checkout/checkout***

# Body Payments with card

```
{
    "address": {
      "street": "test",
      "interiorNumber": "01",
      "zipCode": "12345",
      "colony": "colonia",
      "city": "ciudad"
    },
    "name": "Eddard test",
    "email": "eddard@test.com",
    "number": "5611186966",
    "country": "México",
    "transactionType": "product",
    "paymentMethodType": "card",
    "installments": 1,
    "productKeyName": "moons-kit-hotsale-checkout",
    "paymentLinkKey": null,
    "discountPrice": false,
    "customerId": "qweqe",
    "stripeId": null,
    "conektaId": null,
    "mercadoPagiId: null
}
```
where 

***transactionType: either product or paymentLink***

***productKeyname: the key of the product in b4app***

***paymentLinkKey: the key of the paymentLink in b4app***

