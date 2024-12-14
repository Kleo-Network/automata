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

interface User {
  address: string;
  slug: string;
  _id: string;
  name: string;
  encryptedPrivateKey: string;
  iv: string;
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



// Utility function to get data from chrome storage as a promise
function chromeStorageGet(keys: string[] | string): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (data) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      resolve(data);
    });
  });
}

// Modified initializeUser function
export async function initializeUser(name: string): Promise<User | undefined> {
  try {
    const storageData = await chromeStorageGet(['user']);
    if (storageData?.user) {
      chrome.storage.local.remove('user');
      console.log('User already exists.', storageData.user);
      return storageData.user;
    } else {
      const keyPair = await generateEthereumKeyPair();
      const { privateKey, address } = keyPair;
  
      const response = await apiRequest<createResponse>('POST', 'user/create-user', { address });
      const { slug, _id } = response;
  
      const encryptedPrivateKey = await encryptPrivateKey(privateKey, slug);
  
      const userData = {
        address: address,
        slug: slug,
        _id: _id,
        name: name,
        encryptedPrivateKey: encryptedPrivateKey.data,
        iv: encryptedPrivateKey.iv,
      };
  
      await chrome.storage.local.set({ user: userData });
      return userData;
    }
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

export async function restoreAccount(privateKey: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
   
    // Derive address/publicKey from given private key
    const wallet = new ethers.Wallet(privateKey);
    const address = wallet.address;
    const publicKey = wallet.publicKey.slice(2);

    const response = await apiRequest<createResponse>('GET', `user/get-user/${address}`);
    console.log("restorea account user api", response)

    // hit API from address to get the password and get user. 
    const password = response.slug;
    const encryptedPrivateKey = await encryptPrivateKey(privateKey.replace(/^0x/, ''), password);

    // set user from more fields recieved from api response. 
    const userData = {
      _id: response._id,
      encryptedPrivateKey: encryptedPrivateKey.data,
      slug: password,
      name: response.name,
      address: address,
      iv: encryptedPrivateKey.iv
    };

    // Store in local storage
    await chrome.storage.local.set({ user: userData });

    return { success: true, user: userData };
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
