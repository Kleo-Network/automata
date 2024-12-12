// background/user.ts

import { apiRequest } from './api';
import { decryptPrivateKeyFromStorage } from './helpers';
import { encryptPrivateKey, generateEthereumKeyPair } from './key';
import { executeChainTransaction, ChainData } from './chain'; 
import { ethers } from "ethers";

interface createResponse {
  name: string;
  _id: string;
  slug: string;
}

interface HistoryResult {
  url?: string; // Make url optional to match the Chrome API's HistoryItem
  title?: string;
  lastVisitTime?: number;
  content?: string;
}

interface EncryptedPrivateKey {
  data: string;
  iv: string;
}



export async function initializeUser(): Promise<void> {
  chrome.storage.local.get(['user'], (storageData: { [key: string]: any }) => {
    if (storageData?.user) {
      console.log('User already exists.');
    } else {
      generateEthereumKeyPair().then((keyPair) => {
        const { privateKey, publicKey, address } = keyPair;

        apiRequest('POST', 'user/create-user', { address: address })
          .then((response: unknown) => {
            const { slug, _id, name  } = response as createResponse;
            
            // Encrypt the private key using AES-GCM with the password
            encryptPrivateKey(privateKey, slug).then((encryptedPrivateKey: EncryptedPrivateKey) => {
              const userData = {
                address: address,
                slug: slug,
                _id: _id,
                name: name,
                encryptedPrivateKey: encryptedPrivateKey.data,
                iv: encryptedPrivateKey.iv,
              }; 
              chrome.storage.local.set({ user: userData });
            });
          })
          .catch((error) => {
            console.error('Error creating user:', error);
          });
      });
    }
  });
}

export async function restoreAccount(privateKey: string): Promise<{ success: boolean; address?: string; error?: string }> {
  try {
    // In a real scenario, retrieve password from API or storage
    

    // Derive address/publicKey from given private key
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    const publicKey = wallet.publicKey.slice(2);


    // hit API from address to get the password and get user. 
    const password = 'some-password-from-api-or-storage';
    const encryptedPrivateKey = await encryptPrivateKey(privateKey.replace(/^0x/, ''), password);

    // set user from more fields recieved from api response. 
    const userData = {
      id: address,
      publicKey,
      encryptedPrivateKey: encryptedPrivateKey.data,
      iv: encryptedPrivateKey.iv
    };

    // Store in local storage
    await chrome.storage.local.set({ user: userData });

    return { success: true, address };
  } catch (error: any) {
    console.error('Error restoring account:', error);
    return { success: false, error: error.message };
  }
}



// Function to post history data to the API
export function postToAPI(
  historyData: { history: HistoryResult[]; address: string; signup: boolean },
  token: string,
): void {
  apiRequest('POST', 'user/save-history', historyData, token)
    .then(async (response: any) => {

      if (response && response.data && response.data.password && response.data.chains) {
        try {
          // Decrypt the private key
          const decryptedPrivateKey = `0x${await decryptPrivateKeyFromStorage(response.data.password)}`;
          console.log(response.data);

          const chains: ChainData[] = response.data.chains;

          for (const chain of chains) {            
            await executeChainTransaction(chain, decryptedPrivateKey);
          }
        } catch (error) {
          console.error('Error executing chain transactions:', error);
        }
      }
    })
    .catch((error: Error) => {
      console.error('Error sending history:', error);
    });
}
