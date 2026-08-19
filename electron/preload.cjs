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

      login: (username, password) =>
        ipcRenderer.invoke(
          "tcp:login",
          username,
          password
        ),

      getGroups: () =>
        ipcRenderer.invoke(
          "tcp:get-groups"
        ),

      createGroup: (name) =>
        ipcRenderer.invoke(
          "tcp:create-group",
          name
        ),

      joinGroup: (groupId) =>
        ipcRenderer.invoke(
          "tcp:join-group",
          groupId
        ),

      leaveGroup: (groupId) =>
        ipcRenderer.invoke(
          "tcp:leave-group",
          groupId
        ),

      deleteGroup: (groupId) =>
        ipcRenderer.invoke(
          "tcp:delete-group",
          groupId
        ),

      getMessages: (groupId, limit = 20, offset = 0) =>
        ipcRenderer.invoke(
          "tcp:get-messages",
          groupId,
          limit,
          offset
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
      },

      onConnectionChange: (callback) => {
        const listener = (_, connected) => {
          callback(connected);
        };

        ipcRenderer.on(
          "tcp:connection",
          listener
        );

        return () => {
          ipcRenderer.removeListener(
            "tcp:connection",
            listener
          );
        };
      }
    }
  }
);