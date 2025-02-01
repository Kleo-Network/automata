import { CardTypeToRender, PendingCard } from './interface';

export function capitalizeWords(input: string): string {
  return input
    .split(' ') // Split the string into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter and lower the rest
    .join(' '); // Join the words back into a single string
}

export function convertEpochToISO(epoch: number): string {
  const date = new Date(epoch * 1000); // Convert seconds to milliseconds
  const isoString = date.toISOString(); // Get ISO 8601 string in UTC timezone
  return isoString;
}

export function formatDate(epoch: number): string {
  const date = new Date(epoch * 1000); // Convert epoch to milliseconds

  const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits for day
  const year = date.getFullYear();

  return `${day} ${new Date(epoch * 1000).toLocaleDateString('en-US', {
    month: 'long',
  })} ${year}`;
}

export function parseUrl(url: string): string {
  try {
    // Ensure the URL starts with http:// or https://
    const formattedUrl = url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;

    // Parse the URL
    const { hostname } = new URL(formattedUrl);
    const hostParts = hostname.split('.');
    const n = hostParts.length;

    // Determine the domain
    if (n < 2) return hostname; // If there are less than 2 parts, return the hostname as is

    return n === 4 || (n === 3 && hostParts[n - 2].length <= 3)
      ? `${hostParts[n - 3]}.${hostParts[n - 2]}.${hostParts[n - 1]}`
      : `${hostParts[n - 2]}.${hostParts[n - 1]}`;
  } catch (error) {
    console.error('Invalid URL:', url, error);
    return ''; // Return an empty string or handle as needed
  }
}

export function getDateAndMonth(date: number | undefined) {
  if (date) {
    const givenDate = new Date(date * 1000);
    return `${givenDate.getDate()} ${givenDate.toLocaleString('default', {
      month: 'long',
    })}`;
  }
}

export function replaceSlugInURL(url: string, slug?: string) {
  const final_slug = slug || localStorage.getItem('slug') || '';
  return url.replace('{slug}', final_slug);
}

export const getDaysAgo = (date: number) => {
  const givenDate = new Date(date * 1000);
  const givenDateNum: number = new Date(date).getTime();
  const currentDate: number = new Date().getTime();
  const differenceInTime = currentDate - givenDateNum;
  const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));

  if (differenceInDays === 0) {
    return 'Today';
  } else if (differenceInDays === 1) {
    return '1 day ago';
  } else if (differenceInDays <= 30) {
    return `${differenceInDays} days ago`;
  } else {
    return `${givenDate.toLocaleString('default', {
      month: 'long',
    })} ${givenDate.getDate()}, ${givenDate.getFullYear()}`;
  }
};

export const PURPLE_CARD_RATIO = 0.5;
export function updateCardTypeToRenderInAllCards(data: PendingCard[]) {
  const dataCardIndices: number[] = [];

  // First pass: Assign card types and collect indices of normal data cards
  const updatedData = data.map((cardItem, index) => {
    let cardTypeToRender: CardTypeToRender;

    if (cardItem.urls?.some((url) => extractVideoId(url.url))) {
      cardTypeToRender = CardTypeToRender.YT;
    } else if (cardItem.cardType === 'ImageCard') {
      cardTypeToRender = CardTypeToRender.IMAGE;
    } else if (cardItem.cardType === 'DataCard') {
      cardTypeToRender = CardTypeToRender.DATA;
      dataCardIndices.push(index); // Store index of normal data cards
    } else {
      cardTypeToRender = CardTypeToRender.PURPLE;
    }

    return {
      ...cardItem,
      cardTypeToRender: cardTypeToRender,
    };
  });

  // Calculate the number of PURPLE cards needed based on the ratio
  const numberOfPurpleCards = Math.floor(PURPLE_CARD_RATIO * dataCardIndices.length);

  // Randomly select indices to be marked as PURPLE
  const shuffledIndices = dataCardIndices.sort(() => 0.5 - Math.random()).slice(0, numberOfPurpleCards);

  // Second pass: Update the selected cards to be PURPLE
  shuffledIndices.forEach((index) => {
    updatedData[index].cardTypeToRender = CardTypeToRender.PURPLE;
  });

  return updatedData;
}

export const extractThumbNailURL = (videoURL: string) => {
  let videoId: string | undefined;
  if (videoURL.includes('youtu.be')) {
    // Handle the shortened youtu.be URLs
    videoId = videoURL.split('youtu.be/')[1]?.split('?')[0];
  } else if (videoURL.includes('youtube.com')) {
    // Handle the standard youtube.com URLs
    videoId = videoURL.split('v=')[1]?.split('&')[0];
  }
  const thumbUrl = videoId ? `https://img.youtube.com/vi/${videoId}/sddefault.jpg` : '';
  return thumbUrl;
};

// Helper function to extract the video ID from a YouTube URL
const extractVideoId = (url: string): string | undefined => {
  let videoId: string | undefined;

  if (url.includes('youtu.be')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('youtube.com/watch')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  }

  return videoId;
};

// text = '1234567890', maxLength = 8 => output: '12...890'
export function truncateText(text: string, maxLength: number) {
  const textLength = text.length;

  if (textLength > maxLength) {
    // Calculate the number of characters to show from the start
    const charsToShowFromStart = maxLength - 8;

    // Get the start and end parts of the string
    const startPart = text.substring(0, charsToShowFromStart);
    const endPart = text.substring(textLength - 5);

    return `${startPart}...${endPart}`;
  }

  return text;
}

// timestamp = 1725590962 => output: Sep 8, 2024
export function convertTimeStampToDateString(timeStamp: number) {
  const date = new Date(timeStamp * 1000);

  // Format the date
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return formattedDate;
}

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Set the base URL for your API
// const BASE_URL = 'http://127.0.0.1:8000/api/v1';
const BASE_URL = 'https://fastapi.kleo.network/api/v1';

 // Replace this with your actual base URL

// Create a reusable function to make API requests
export const apiRequest = async <T>(
  endpoint: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> => {
  try {
    // Set up the request with the base URL
    const response = await axios({
      url: `${BASE_URL}${endpoint}`,
      ...config, // Allows config overrides such as headers, params, etc.
    });
    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};