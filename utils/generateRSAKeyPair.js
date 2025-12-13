const fs = require('fs');
const crypto = require('crypto');

const generateRSAKeyPair = () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
    });

    fs.writeFileSync('../public.key', publicKey);
    fs.writeFileSync('../private.key', privateKey);

    console.log('Keys generated and saved as public.key and private.key');
};

generateRSAKeyPair();