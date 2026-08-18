export class MessageParser {
  constructor() {
    this.buffer = "";
  }

  feed(data) {
    this.buffer += data.toString("utf-8");

    const messages = [];

    let newlineIndex;

    while (
      (newlineIndex = this.buffer.indexOf("\n")) !== -1
    ) {
      const rawMessage =
        this.buffer.slice(0, newlineIndex);

      this.buffer =
        this.buffer.slice(newlineIndex + 1);

      if (!rawMessage.trim()) {
        continue;
      }

      try {
        messages.push(JSON.parse(rawMessage));
      } catch {
        console.error(
          "Mensagem JSON inválida:",
          rawMessage
        );
      }
    }

    return messages;
  }
}