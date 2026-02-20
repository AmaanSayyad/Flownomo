import { ethers } from 'ethers';

/**
 * Validates wallet addresses for supported networks
 * @param address Address to validate
 * @returns boolean
 */
export const isValidAddress = async (address: string): Promise<boolean> => {
    if (!address) return false;

    // 1. BNB (EVM)
    if (ethers.isAddress(address)) return true;

    // 2. Tezos (XTZ)
    if (/^(tz1|tz2|tz3|KT1)[a-zA-Z0-9]{33}$/.test(address)) return true;

    // 3. Stellar (XLM)
    if (/^G[A-Z2-7]{55}$/.test(address)) return true;

    // 4. Sui (SUI) - 0x followed by 64 hex characters
    if (/^0x[0-9a-fA-F]{64}$/.test(address)) return true;

    // 5. NEAR - Account ID (e.g. *.near) or 64-char hex
    if (/^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/.test(address)) return true;
    if (/^[0-9a-fA-F]{64}$/.test(address)) return true;

    // 6. Solana (SOL) - Base58 string
    try {
        const { PublicKey } = await import('@solana/web3.js');
        const pk = new PublicKey(address);
        return pk.toBuffer().length === 32;
    } catch (e) {
        // Not a valid Solana address
    }

    return false;
};
