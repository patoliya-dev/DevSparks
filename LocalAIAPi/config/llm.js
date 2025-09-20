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
        device: "gpu", // defaults to 'cpu'
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

export const loadGPT4AllModel = async (prompt) => {
  const res1 = await createCompletion(chatInstance, prompt);

  return res1.choices[0].message.content;
};

export function formatSingleLine(text) {
  return text
    .replace(/\n+/g, " ") // replace newlines with space
    .replace(/[^\w\s]+/g, "") // remove all punctuation/symbols
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim(); // remove leading/trailing spaces
}
