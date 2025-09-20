// models/llms.js

/**
 * Dummy LLM response function
 * @param {string} message - Latest user message
 * @param {Array<{ role: string, content: string }>} history - Last N messages
 * @returns {Promise<string>} - Assistant response
 */
export async function getLLMResponse(message, history) {
  // Lowercase for simple pattern matching
  const text = message.toLowerCase().trim();

  // Simple hardcoded responses
  if (text.includes("hello") || text.includes("hi")) {
    return "Hello! How can I help you today?";
  }

  if (text.includes("your name")) {
    return "I'm your friendly assistant!";
  }

  if (text.includes("time")) {
    return `Current time is ${new Date().toLocaleTimeString()}`;
  }

  if (text.includes("date")) {
    return `Today's date is ${new Date().toLocaleDateString()}`;
  }

  // Example: remember previous messages
  if (text.includes("what did i say")) {
    const userMessages = history
      .filter((m) => m.role === "user")
      .map((m, i) => `${i + 1}. ${m.content}`)
      .join("\n");
    return userMessages ? `You said:\n${userMessages}` : "You haven't said anything yet.";
  }

  // Default fallback
  return "Sorry, I didn't understand that. Can you rephrase?";
}
