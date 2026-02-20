const nearAPI = require("near-api-js");

const { KeyPair } = nearAPI;

const keyPair = KeyPair.fromRandom("ed25519");
const publicKey = keyPair.publicKey.toString();
const privateKey = keyPair.toString();

// On NEAR, the implicit account ID is the lowercase hex representation of the public key's data
const accountId = Buffer.from(keyPair.publicKey.data).toString('hex');

console.log("NEAR Treasury Wallet Generated:");
console.log("Account ID:", accountId);
console.log("Public Key:", publicKey);
console.log("Private Key:", privateKey);
console.log("\nAdd these to your .env file:");
console.log(`NEXT_PUBLIC_NEAR_TREASURY_ADDRESS=${accountId}`);
console.log(`NEAR_TREASURY_ACCOUNT_ID=${accountId}`);
console.log(`NEAR_TREASURY_PRIVATE_KEY=${privateKey}`);
