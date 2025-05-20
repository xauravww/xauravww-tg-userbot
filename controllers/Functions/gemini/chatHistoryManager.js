const TOKEN_LIMIT = 909999; // Token limit for pruning

// Function to calculate token count for a message
function calculateTokenCount(text) {
  // Estimate token count based on character length (average: 4 characters per token)
  return Math.ceil(text.length / 4);
}

// Function to prune history if it exceeds the token limit
function pruneHistory(history) {
  // Calculate total token count including system prompt
  let tokenCount = history.reduce((sum, msg) => {
    const text = msg.parts ? (msg.parts[0]?.text || "") : (msg.content || "");
    return sum + calculateTokenCount(text);
  }, 0);

  // Prune only messages after the first (system prompt)
  while (tokenCount > TOKEN_LIMIT && history.length > 1) {
    const removedMsg = history[1]; // second message
    const text = removedMsg.parts ? (removedMsg.parts[0]?.text || "") : (removedMsg.content || "");
    tokenCount -= calculateTokenCount(text);
    history.splice(1, 1); // remove second message
  }
}



// Class to manage chat histories per senderId
class ChatHistoryManager {
  constructor() {
    this.chatHistories = {};
  }

  getHistory(senderId) {
    if (!this.chatHistories[senderId]) {
      this.chatHistories[senderId] = [
        { role: "system", content: process.env.SYSTEM_INSTRUCTIONS_GEMINI }
      ];
    }
    return this.chatHistories[senderId];
  }


  addMessage(senderId, message) {
    const history = this.getHistory(senderId);
    history.push(message);
    pruneHistory(history);
  }
}

export default new ChatHistoryManager();
