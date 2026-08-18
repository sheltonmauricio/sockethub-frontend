import {
  createConnection
} from "node:net";

import {
  MessageParser
} from "../protocol/parser.js";

import {
  serializeMessage
} from "../protocol/serializer.js";

export class TcpClient {
  constructor() {
    this.socket = null;
    this.parser = new MessageParser();
    this.connected = false;
    this.messageCallback = null;
  }

  onMessage(callback) {
    this.messageCallback = callback;
  }

  connect(host, port) {
    return new Promise((resolve, reject) => {
      if (
        this.socket &&
        !this.socket.destroyed
      ) {
        resolve(true);
        return;
      }

      this.socket = createConnection(
        {
          host,
          port
        },
        () => {
          this.connected = true;

          console.log(
            `TCP conectado a ${host}:${port}`
          );

          resolve(true);
        }
      );

      this.socket.on(
        "data",
        (data) => {
          try {
            const messages =
              this.parser.feed(data);

            for (
              const message of messages
            ) {
              console.log(
                "TCP recebido:",
                message
              );

              if (
                this.messageCallback
              ) {
                this.messageCallback(
                  message
                );
              }
            }
          } catch (error) {
            console.error(
              "Erro ao processar mensagem:",
              error
            );
          }
        }
      );

      this.socket.on(
        "close",
        () => {
          this.connected = false;
          this.socket = null;

          console.log(
            "TCP desconectado."
          );
        }
      );

      this.socket.on(
        "error",
        (error) => {
          this.connected = false;

          console.error(
            "Erro TCP:",
            error.message
          );

          reject(error);
        }
      );
    });
  }

  disconnect() {
    if (!this.socket) {
      return;
    }

    this.socket.end();

    this.socket = null;
    this.connected = false;
  }

  send(message) {
    if (
      !this.socket ||
      this.socket.destroyed
    ) {
      throw new Error(
        "Socket TCP não está conectado."
      );
    }

    this.socket.write(
      serializeMessage(message)
    );
  }

  isConnected() {
    return (
      this.connected &&
      this.socket !== null &&
      !this.socket.destroyed
    );
  }
}