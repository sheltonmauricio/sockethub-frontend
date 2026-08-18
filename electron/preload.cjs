const {
  contextBridge,
  ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
  "electronAPI",
  {
    tcp: {
      connect: (host, port) =>
        ipcRenderer.invoke(
          "tcp:connect",
          host,
          port
        ),

      disconnect: () =>
        ipcRenderer.invoke(
          "tcp:disconnect"
        ),

      send: (message) =>
        ipcRenderer.invoke(
          "tcp:send",
          message
        ),

      isConnected: () =>
        ipcRenderer.invoke(
          "tcp:is-connected"
        ),

      onMessage: (callback) => {
        const listener = (_, message) => {
          callback(message);
        };

        ipcRenderer.on(
          "tcp:message",
          listener
        );

        return () => {
          ipcRenderer.removeListener(
            "tcp:message",
            listener
          );
        };
      }
    }
  }
);