import type { TcpMessage } from "../protocol/messages";

interface ElectronTcpApi {
  connect(
    host: string,
    port: number
  ): Promise<boolean>;

  disconnect(): Promise<void>;

  send(message: unknown): Promise<void>;

  login(
    username: string,
    password: string
  ): Promise<void>;

  getGroups(): Promise<void>;

  createGroup(
    name: string
  ): Promise<void>;

  joinGroup(
    groupId: number
  ): Promise<void>;

  leaveGroup(
    groupId: number
  ): Promise<void>;

  getMessages(
    groupId: number,
    limit?: number,
    offset?: number
  ): Promise<void>;

  deleteGroup: (
    groupId: number
  ) => Promise<void>;

  isConnected(): Promise<boolean>;

  onMessage(
    callback: (message: TcpMessage) => void
  ): () => void;

  onConnectionChange(
    callback: (connected: boolean) => void
  ): () => void;
}

interface ElectronAPI {
  tcp: ElectronTcpApi;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};