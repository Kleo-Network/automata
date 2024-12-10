import axios from "axios";

// Define the LLM class
class LLM {
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = '';
    this.apiKey = '';
  }

  async initialize() {
    const result = await chrome.storage.local.get(['url', 'apiKey']);
    const endpoint = result.url;
    const apiKey = result.apiKey;
    if (!endpoint || !apiKey) {
      throw new Error("Environment variables 'url' and 'apiKey' must be set.");
    }
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  /**
   * Sends a request to the LLM with custom input and a prompt.
   * @param input - The input string for the LLM.
   * @param prompt - The custom prompt string.
   * @returns A promise that resolves to the LLM's output.
   */
  async sendRequest(input: string, prompt: string): Promise<number> {
    const requestBody = {
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: input }
      ],
      temperature: 0.7,
      max_tokens: 500
    };

    try {
      const response = await axios.post(
        this.endpoint,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": `${this.apiKey}`
          }
        }
      );
      return Number(response.data.choices[0].message.content.trim());
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Axios error: ${error.message}`);
      }
      throw new Error(`Unexpected error: ${(error as Error).message}`);
    }
  }
}

// Export the class for use in other files
export default LLM;

// Test function to validate the LLM interaction


// Uncomment the line below to test the function
//testLLM();

