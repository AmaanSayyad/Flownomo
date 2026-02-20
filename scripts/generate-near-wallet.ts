import * as nearAPI from "near-api-js";
import * as fs from "fs";

const { KeyPair } = nearAPI;

const keyPair = KeyPair.fromRandom("ed25519");
const publicKey = keyPair.getPublicKey().toString();
const privateKey = keyPair.toString();
const accountId = Buffer.from(keyPair.getPublicKey().data).toString('hex');

const output = `
NEAR Treasury Wallet Generated:
Account ID: ${accountId}
Public Key: ${publicKey}
Private Key: ${privateKey}

Add these to your .env file:
NEXT_PUBLIC_NEAR_TREASURY_ADDRESS=${accountId}
NEAR_TREASURY_ACCOUNT_ID=${accountId}
NEAR_TREASURY_PRIVATE_KEY=${privateKey}
`;

fs.writeFileSync("near-wallet.txt", output);
console.log("Wallet generated in near-wallet.txt");
