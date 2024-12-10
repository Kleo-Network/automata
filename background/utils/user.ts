// background/user.ts

import { apiRequest } from './api';
import { decryptPrivateKeyFromStorage } from './helpers';
import { encryptPrivateKey, generateEthereumKeyPair } from './key';
import { executeChainTransaction, ChainData } from './chain'; 

interface createResponse {
  password: string;
  token: string;
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
            const { password, token } = response as createResponse;
            
            // Encrypt the private key using AES-GCM with the password
            encryptPrivateKey(privateKey, password).then((encryptedPrivateKey: EncryptedPrivateKey) => {
              const userData = {
                id: address,
                publicKey: publicKey,
                encryptedPrivateKey: encryptedPrivateKey.data,
                iv: encryptedPrivateKey.iv,
              };

              // Store the user data in local storage
              chrome.storage.local.set({ user: userData }, () => {
                fetchAndSendHistory(100, token, userData.id);
              });
            });
          })
          .catch((error) => {
            console.error('Error creating user:', error);
          });
      });
    }
  });
}

// Function to fetch and send the last N history items
function fetchAndSendHistory(maxResults: number, token: string, userId: string): void {
  chrome.history.search(
    {
      text: '',
      maxResults: maxResults,
      startTime: 0, // From the beginning of time
      endTime: Date.now(),
    },
    (results: chrome.history.HistoryItem[]) => {
      const filteredResults: HistoryResult[] = results.map((result) => ({
        url: result.url || '', // Handle cases where url is undefined
        title: result.title || '',
        lastVisitTime: result.lastVisitTime || 0,
      }));

      if (filteredResults.length > 0) {
        postToAPI(
          {
            history: filteredResults,
            address: userId,
            signup: true,
          },
          token,
        );
      } else {
        console.log('No history items found.');
      }
    },
  );
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
