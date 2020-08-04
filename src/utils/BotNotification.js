const axios = require('axios');
const CustomResponse = require('./CustomResponse');
const { ERRORSCODE } = require('./Enums');

function IsJsonString(str) {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}


const notificate = async (text,customerId,email) => {
  try {
    const user = process.env.BASIC_AUTH_USERNAME;
    const password = process.env.BASIC_AUTH_PASSWORD;
    const auth = `${user}:${password}`;
    const authEncoded = `Basic ${Buffer.from(auth).toString('base64')}`;
    console.log({text})
    let newText = text
    let objText = null
    if(IsJsonString(text)) {
      objText = JSON.parse(text)
    }
    if(objText) {
      let message = objText.message
      if (typeof objText.message !== "string") {
        message = JSON.stringify(objText.message)
      }

      newText = 
      `
      CustomerId: ${customerId}
      Email: ${email}
      Type: ${objText && objText.type}
      Status: ${objText && objText.status}
      Code: ${objText && objText.code}
      Detail: ${objText && objText.detail}
      Message: ${message}
      `

    }
    let botChannelError = process.env.BOT_CHANNEL_ERROR_TRANSACTION
    let botUrl = process.env.BOT_CHANNEL_URL_MATTERMOST
    let botUsername = process.env.BOT_USERNAME
    let botIcon = process.env.BOT_ICON_URL
    let headers = {
      'Authorization': authEncoded,
      'Content-Type': 'application/json'
    }
    const body = {
      "text": newText,
      "channel": botChannelError.toString(),
      "username": botUsername.toString(),
      "icon_url":botIcon.toString()
    }
    console.log({body})
    console.log({
      botUrl,
      botChannelError,
      botUsername,
      botIcon
    })
    botUrl = botUrl.toString()
    const responseNotificate = await axios.post(botUrl,body,{headers:headers}) 
    console.log(responseNotificate)
  }catch(error) {
    console.log("***ERROR BOT ****")
    console.log(error.response.data)
    if (error.response) {
      throw CustomResponse.errorResponse(500,error.response.data,ERRORSCODE.bot_error)
    }
    throw error
  }
}

module.exports = {notificate}