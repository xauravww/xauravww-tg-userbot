/**
 * Custom message classifier function
 * Classifies a given text message into an endpoint, message, and download flag.
 * Returns a JSON object with keys: endpoint, message, download.
 */

export function classifyMessage(text) {
  // Remove ```json wrapper if present
  const jsonText = text.startsWith("```json")
    ? text.replace(/```json\\s*([\\s\\S]*?)\\s*```/, '$1')
    : text;

  // Define commands list
  const allCommands = [
    '/feed', '/isign', '/vsign', '/gif', 'gif', '/fun', 'fun', '/ping', 'ping',
    '/userid', 'userid', '/stop', 'stop', '/ask', 'ask', '/gen', '/song',
    '/lyrics', 'lyrics', '/about', 'about', '/start', 'start', '/help', 'help', '/set', 'set'
  ];

  // Helper to check if text contains any download keywords
  const downloadKeywords = ['download', 'save', 'get'];
  const containsDownload = downloadKeywords.some(keyword => text.toLowerCase().includes(keyword));

  // Determine endpoint based on text content
  let endpoint = '/ask'; // default
  let message = text;

  if (/random gif/i.test(text)) {
    endpoint = '/gif';
  } else if (/create|generate|image|artwork|graphics/i.test(text)) {
    // Only use /gen if explicitly image generation related
    endpoint = '/gen';
  } else if (/help/i.test(text)) {
    endpoint = '/help';
  } else if (/start/i.test(text)) {
    endpoint = '/start';
  } else if (/about/i.test(text)) {
    endpoint = '/about';
  } else if (/song/i.test(text) && containsDownload) {
    endpoint = '/song';
  } else if (/gif/i.test(text)) {
    endpoint = '/gif';
  } else if (/ask|code|explanation|information/i.test(text)) {
    endpoint = '/ask';
  }

  return {
    endpoint,
    message,
    download: containsDownload
  };
}
