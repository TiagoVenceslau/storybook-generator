export function safeParseJSON(str: string) {
  const match = str.match(/^```json\n([\s\S]*)\n```$/);
  try {
    return JSON.parse(match ? match[1] : str);
  } catch (e: unknown) {
    throw new Error(`Failed to safe parse JSON: ${e}`);
  }
}