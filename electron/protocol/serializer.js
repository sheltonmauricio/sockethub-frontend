export function serializeMessage(message) {
  return Buffer.from(
    `${JSON.stringify(message)}\n`,
    "utf-8"
  );
}