/**
 * Greets a user with a personalized message
 * @param name - The name to greet (can be null, undefined, empty, or whitespace)
 * @returns A greeting message string
 */
export function greetUser(name: string | null | undefined): string {
  // Handle null, undefined, empty string, or whitespace-only strings
  if (!name || name.trim() === '') {
    return 'Hello, World!';
  }

  return `Hello, ${name}!`;
}
