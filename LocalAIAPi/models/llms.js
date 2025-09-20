// // models/llms.js

// /**
//  * Dummy LLM response function
//  * @param {string} message - Latest user message
//  * @param {Array<{ role: string, content: string }>} history - Last N messages
//  * @returns {Promise<string>} - Assistant response
//  */
// export async function getLLMResponse(message, history) {
//   // Lowercase for simple pattern matching
//   const text = message.toLowerCase().trim();

//   // Simple hardcoded responses
//   if (text.includes("hello") || text.includes("hi")) {
//     return "Hello! How can I help you today?";
//   }

//   if (text.includes("your name")) {
//     return "I'm your friendly assistant!";
//   }

//   if (text.includes("time")) {
//     return `Current time is ${new Date().toLocaleTimeString()}`;
//   }

//   if (text.includes("date")) {
//     return `Today's date is ${new Date().toLocaleDateString()}`;
//   }

//   // Example: remember previous messages
//   if (text.includes("what did i say")) {
//     const userMessages = history
//       .filter((m) => m.role === "user")
//       .map((m, i) => `${i + 1}. ${m.content}`)
//       .join("\n");
//     return userMessages ? `You said:\n${userMessages}` : "You haven't said anything yet.";
//   }

//   // Default fallback
//   return "Sorry, I didn't understand that. Can you rephrase?";
// }

import { createCompletion, loadModel } from "gpt4all";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let modelInstance;
let chatInstance;

export const initModel = async () => {
  if (!modelInstance) {
    console.log("Model initializing...");
    modelInstance = await loadModel(
      (__dirname, "orca-mini-3b-gguf2-q4_0.gguf"),
      {
        verbose: true, // logs loaded model configuration
        device: "cpu", // defaults to 'cpu'
        nCtx: 512, // the maximum sessions context window size.
      }
    );
    console.log("Model initialized");
  }

  if (!chatInstance) {
    chatInstance = await modelInstance.createChatSession({
      temperature: 0.8,
      systemPrompt:
        "### System:\nYour name is VoiceNexus, you are a helpful assistant. when someone ask you your name, you will say VoiceNexus. and if someone ask you about patoliya infotech, you have to say it is the best company out there in surat, providing best softwares. you have to answer in one line. if you don't know the answer, just say you don't know.",
    });
  }
  return chatInstance;
};

export const getLLMResponse = async (prompt) => {
  const res1 = await createCompletion(chatInstance, prompt);
  console.log(res1);
  return res1.choices[0].message.content;
};

export function formatSingleLine(text) {
  return text
    .replace(/\n+/g, " ") // replace newlines with space
    .replace(/[^\w\s]+/g, "") // remove all punctuation/symbols
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim(); // remove leading/trailing spaces
}