/**
 * Validates Flow wallet addresses (Flownomo is Flow-only).
 * Flow addresses: 0x followed by 16 hex characters (8-byte account address).
 * @param address Address to validate
 * @returns boolean
 */
export const isValidAddress = async (address: string): Promise<boolean> => {
    if (!address) return false;
    // Flow: 0x + 16 hex chars (canonical); also accept longer hex for compatibility
    return /^0x[0-9a-fA-F]{16}$/.test(address) || /^0x[0-9a-fA-F]{1,64}$/.test(address);
};
