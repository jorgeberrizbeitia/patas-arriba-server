// this code is executed once with node to obtain push notifications keys used in the .env

const webPush = require('web-push');

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();

console.log("Public Key: ", vapidKeys.publicKey);
console.log("Private Key: ", vapidKeys.privateKey);