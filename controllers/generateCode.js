exports.generateCode = () => {
     return Math.floor(10000 + Math.random() * 90000).toString();
}
exports.phoneCode = () => {
     return '44' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
}


exports.generateRandomString = (length) => {
     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
     let randomString = '';

     for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          randomString += characters.charAt(randomIndex);
     }

     return randomString;
}
exports.generateTXIDString = () => {
     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
     let randomString = '';

     for (let i = 0; i < 3; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          randomString += characters.charAt(randomIndex);
     }

     return randomString + (Math.floor(10000 + Math.random() * 90000).toString());
}

exports.generateRandomCode = (length = 10) => {
     const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
     let randomCode = '';
     for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          randomCode += characters[randomIndex];
     }
     return randomCode;
};

exports.generateUniqueQuoteNo = async (model, name = "QUOTE") => {
     let newQuoteNo;
     let isUnique = false;

     while (!isUnique) {
          newQuoteNo = `${name}${Math.floor(100000000 + Math.random() * 900000000).toString()}`;
          const existingQuote = await model.findOne({ quoteNo: newQuoteNo });

          if (!existingQuote) {
               isUnique = true;
          }
     }

     return newQuoteNo;
};

