import { apiRequest } from "./api";

const DEFAULT_MODEL = "gpt-4o";

// Define the LLM class
export async function askAi(prompt: string, model = DEFAULT_MODEL): Promise<string> {
  // Prepare the payload that your /ask endpoint expects
  const payload = {
    prompt,
    model,
  };
  
  // Use the apiRequest helper to call your /ask endpoint
  // NOTE: The second argument is the path (relative to your baseUrl), e.g. "ask"
  // If your FastAPI server is set to `/api/v1/ask`, then use that route.
  const response = await apiRequest<any>("POST", "llm/ask", payload);
  
  // The API returns: { "response": "assistant's reply" }
  return response.response;
}


// Uncomment the line below to test the function

// (async function testAsking() {
//   try {
//     const input = "2 + 2";
//     const prompt = "You are a math assistant. Return the result of the calculation as a single integer.";
//     const result = await askAi(input, prompt, "gpt-4o-mini");
//     console.log("AI Response =>", result);
//   } catch (error) {
//     console.error("Error =>", error);
//   }
// })();
// Test function to validate the LLM interaction

