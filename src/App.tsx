import { useEffect, useState } from "react";

const HOST = "localhost";
const PORT = 5000;

function App() {
  const [connected, setConnected] =
    useState(false);

  const [message, setMessage] =
    useState<unknown>(null);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    const unsubscribe =
      window.electronAPI.tcp.onMessage(
        (message) => {
          console.log(
            "Mensagem recebida no React:",
            message
          );

          setMessage(message);
        }
      );

    return unsubscribe;
  }, []);

  async function connect() {
    setError(null);

    try {
      await window.electronAPI.tcp.connect(
        HOST,
        PORT
      );

      setConnected(true);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao conectar."
      );
    }
  }

  async function disconnect() {
    await window.electronAPI.tcp.disconnect();

    setConnected(false);
  }

  function sendPing() {
    window.electronAPI.tcp.send({
      type: "PING"
    });
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow">
        <h1 className="text-3xl font-bold">
          SocketHub
        </h1>

        <p className="mt-4">
          TCP:{" "}
          <strong>
            {connected
              ? "Conectado"
              : "Desconectado"}
          </strong>
        </p>

        <div className="mt-6 flex gap-3">
          {!connected ? (
            <button
              onClick={connect}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white"
            >
              Conectar
            </button>
          ) : (
            <>
              <button
                onClick={sendPing}
                className="rounded-lg bg-green-600 px-4 py-2 text-white"
              >
                Ping
              </button>

              <button
                onClick={disconnect}
                className="rounded-lg bg-red-600 px-4 py-2 text-white"
              >
                Desconectar
              </button>
            </>
          )}
        </div>

        {error && (
          <p className="mt-4 text-red-600">
            {error}
          </p>
        )}

        <div className="mt-6">
          <p className="font-semibold">
            Última mensagem:
          </p>

          <pre className="mt-2 rounded-lg bg-gray-100 p-4 text-sm">
            {JSON.stringify(
              message,
              null,
              2
            )}
          </pre>
        </div>
      </div>
    </main>
  );
}

export default App;