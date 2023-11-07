export function trimTextToToken(text: string, maxTokenLength: number) {
  const words = text.split(" ");
  let tokens = "";

  for (let i = 0; i < words.length; i++) {
    if ((tokens + words[i]).length <= maxTokenLength) {
      tokens += words[i] + " ";
    } else {
      break;
    }
  }

  return tokens.trim();
}
