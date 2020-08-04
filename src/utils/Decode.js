const querystring = require("querystring");
const get = data => {
    try{
        
        let response = false;
        if (data) {
            try {
                response = JSON.parse(data);
            } catch(err){
                try{
                    response = JSON.parse(JSON.stringify(querystring.parse(data)));
                }catch(err){
                    throw(err);
                }
            }
        }

        console.log(JSON.stringify(response));
        return response;
    }catch(err){
        throw(err);
    }
};

module.exports = { get };
