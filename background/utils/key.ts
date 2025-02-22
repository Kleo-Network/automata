// background/utils/key.ts
import * as eccrypto from "@toruslabs/eccrypto";
import { Buffer } from "buffer";

import { ethers } from "ethers";
// Make sure to include ethers.js in your project
// You can include it via CDN in your HTML file or install it via npm

export async function generateEthereumKeyPair() {
    // Create a random wallet
    const wallet = ethers.Wallet.createRandom();

    const privateKeyHex = wallet.privateKey.slice(2); // Remove '0x' prefix
    const publicKeyHex = wallet.publicKey.slice(2);   // Remove '0x' prefix
    const address = wallet.address;

    return {
        privateKey: privateKeyHex,
        publicKey: publicKeyHex,
        address: address
    };
}
export async function encryptPrivateKey(privateKeyHex, password) {
    const enc = new TextEncoder();
    let keyData = enc.encode(password);

    if (keyData.length === 16 || keyData.length === 24 || keyData.length === 32) {
    } else if (keyData.length > 32) {
        keyData = keyData.slice(0, 32);
    } else {
        const paddedLength = keyData.length < 16 ? 16 : keyData.length < 24 ? 24 : 32;
        const paddedKey = new Uint8Array(paddedLength);
        paddedKey.set(keyData);
        keyData = paddedKey;
    }

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const data = enc.encode(privateKeyHex);
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv
        },
        key,
        data
    );
    return {
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(encryptedData)
    };
}

export async function encryptOwnerSigWithPublicKey(data: string, publicKey: string): Promise<string> {
    const publicKeyBytes = Buffer.from(publicKey.startsWith("0x") ? publicKey.slice(2) : publicKey, "hex");
    const uncompressedKey = publicKeyBytes.length === 64 ? Buffer.concat([Buffer.from([4]), publicKeyBytes]) : publicKeyBytes;
    const fixed_iv = Buffer.from(crypto.getRandomValues(new Uint8Array(16)));
    const fixed_ephemeral_key = Buffer.from(crypto.getRandomValues(new Uint8Array(32)));

    const encryptedBuffer = await eccrypto.encrypt(uncompressedKey, Buffer.from(data), {
      iv: fixed_iv,
      ephemPrivateKey: fixed_ephemeral_key,
    });
    const encryptedHex = Buffer.concat([encryptedBuffer.iv, encryptedBuffer.ephemPublicKey, encryptedBuffer.ciphertext, encryptedBuffer.mac]).toString("hex");
    return encryptedHex;
};

export async function encryptData(data: string, key: string) {
    const enc = new TextEncoder();
    const keyData = Buffer.from(key.startsWith("0x") ? key.slice(2) : key, "hex");
    const iv = crypto.getRandomValues(new Uint8Array(16)); // 128-bit IV for AES-CBC
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        keyData,
        'AES-CBC',
        false,
        ['encrypt']
    );
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'AES-CBC',
            iv: iv
        },
        keyMaterial,
        enc.encode(data)
    );
    console.log("encryptedData", encryptedData);
    console.log("iv", iv);

    const encodedData = arrayBufferToBase64([...new Uint8Array(iv), ...new Uint8Array(encryptedData)]);
    return encodedData;
}

function arrayBufferToBase64(buffer) {
    console.log("buffer", buffer);
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Function to get data from chrome.storage.local and return a Promise
export function getFromStorage(key: string): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, function (result) {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    });
}

// Function to decrypt the private key
export async function decryptPrivateKey(encryptedData: { iv: string; encryptedPrivateKey: string }, password: string): Promise<string> {
    const enc = new TextEncoder();
    const dec = new TextDecoder();

    let keyData = enc.encode(password);

    // Adjust key length for AES-GCM
    keyData = adjustKeyLength(keyData);

    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        'AES-GCM',
        false,
        ['decrypt']
    );

    const iv = base64ToArrayBuffer(encryptedData.iv);
    const data = base64ToArrayBuffer(encryptedData.encryptedPrivateKey);

    const decryptedData = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        data
    );

    const decryptedPrivateKeyHex = dec.decode(decryptedData);
    return decryptedPrivateKeyHex;
}

// Helper function to adjust key length for AES-GCM
function adjustKeyLength(keyData: Uint8Array): Uint8Array {
    if ([16, 24, 32].includes(keyData.length)) {
        return keyData;
    } else if (keyData.length > 32) {
        return keyData.slice(0, 32);
    } else {
        const paddedLength = keyData.length < 16 ? 16 : keyData.length < 24 ? 24 : 32;
        const paddedKey = new Uint8Array(paddedLength);
        paddedKey.set(keyData);
        return paddedKey;
    }
}

// Helper function to convert base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const length = binaryString.length;
    const bytes = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

// Function to execute the smart contract function
export async function executeSmartContractFunction(privateKey: string, rpcUrl: string, contractData: any): Promise<void> {
    // Initialize the provider with the RPC URL
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Initialize the wallet with the decrypted private key and provider
    const wallet = new ethers.Wallet(privateKey, provider);

    // Extract contract details
    const contractAddress = contractData.address;
    const contractABI = contractData.abi;
    const functionName = contractData.functionName;
    const functionParams = contractData.functionParams || [];
    if(functionParams[1] === null){
        functionParams[1] = "emptyparams"
    }
    // Initialize the contract instance
    const contract = new ethers.Contract(contractAddress, contractABI, wallet);

    try {
        const nonce = await provider.getTransactionCount(wallet.address, 'latest');
        const transactionResponse = await contract[functionName](...functionParams, {
            gasPrice: (await provider.getFeeData()).gasPrice,
            nonce: nonce 
        });
        // Wait for the transaction to be mined
        const receipt = await transactionResponse.wait();
        console.log("transaction hash", receipt);
    } catch (error) {
        console.error('Error executing transaction:', error);
    }
}

