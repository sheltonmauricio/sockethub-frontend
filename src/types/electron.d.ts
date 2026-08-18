export {};

declare global {
  interface Window {
    electronAPI: {
      tcp: {
        connect(
          host: string,
          port: number
        ): Promise<boolean>;

        disconnect(): Promise<void>;

        send(
          message: unknown
        ): Promise<void>;

        isConnected(): Promise<boolean>;

        onMessage(
          callback: (
            message: unknown
          ) => void
        ): () => void;
      };
    };
  }
}