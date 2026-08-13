export function decodeBase64Pdf(base64: string) {
  const binary = atob(base64);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}
