import { useEffect, useState } from "react";
import { TCP_CONFIG } from "./config";

type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected";

interface User {
  id: number;
  username: string;
}

function App() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const removeConnectionListener =
      window.electronAPI.tcp.onConnectionChange(
        (connected) => {
          setConnectionState(
            connected
              ? "connected"
              : "disconnected"
          );

          if (!connected) {
            setLoading(false);
          }
        }
      );

    const removeMessageListener =
      window.electronAPI.tcp.onMessage(
        (message) => {
          console.log(
            "Mensagem do servidor:",
            message
          );

          if (
            message.type ===
            "LOGIN_RESPONSE"
          ) {
            setLoading(false);

            if (
              message.success &&
              message.payload?.user
            ) {
              setUser(
                message.payload.user
              );

              setError("");
              setPassword("");

              return;
            }

            setError(
              message.error?.message ??
                "Falha na autenticação."
            );

            return;
          }

          if (
            message.type === "ERROR"
          ) {
            setLoading(false);

            setError(
              message.payload?.message ??
                "Erro de comunicação com o servidor."
            );
          }
        }
      );

    void window.electronAPI.tcp.connect(
      TCP_CONFIG.host,
      TCP_CONFIG.port
    );

    return () => {
      removeConnectionListener();
      removeMessageListener();
    };
  }, []);

  function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    setError("");

    if (!username.trim() || !password) {
      setError(
        "Informe o username e a password."
      );

      return;
    }

    if (
      connectionState !== "connected"
    ) {
      setError(
        "Não existe conexão com o servidor."
      );

      return;
    }

    setLoading(true);

    window.electronAPI.tcp.login(
      username.trim(),
      password
    );
  }

  function handleLogout(): void {
    window.electronAPI.tcp.send({
      type: "LOGOUT",
      requestId: crypto.randomUUID(),
      payload: {}
    });

    setUser(null);
  }

  const isConnected =
    connectionState === "connected";

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md">

        <header className="mb-8">
          <h1 className="text-3xl font-bold">
            SocketHub
          </h1>

          <p className="mt-2 text-slate-400">
            Sistema de mensagens distribuído
          </p>
        </header>

        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              Estado TCP
            </span>

            <span
              className={
                connectionState ===
                "connected"
                  ? "text-green-400"
                  : connectionState ===
                      "connecting"
                    ? "text-yellow-400"
                    : "text-red-400"
              }
            >
              {connectionState ===
              "connected"
                ? "Conectado"
                : connectionState ===
                    "connecting"
                  ? "Conectando..."
                  : "Desconectado"}
            </span>
          </div>
        </div>

        {user ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">
              Bem-vindo, {user.username}
            </h2>

            <p className="mt-2 text-slate-400">
              ID do usuário: {user.id}
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-md bg-red-600 px-4 py-2 font-medium transition hover:bg-red-500"
            >
              Terminar sessão
            </button>
          </section>
        ) : (
          <form
            onSubmit={handleLogin}
            className="rounded-lg border border-slate-800 bg-slate-900 p-6"
          >
            <h2 className="mb-6 text-xl font-semibold">
              Entrar
            </h2>

            <div className="mb-4">
              <label
                htmlFor="username"
                className="mb-2 block text-sm text-slate-300"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                value={username}
                disabled={loading}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
                placeholder="Username"
                autoComplete="username"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                disabled={loading}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
                placeholder="Password"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                !isConnected || loading
              }
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "A autenticar..."
                : "Entrar"}
            </button>
          </form>
        )}

      </section>
    </main>
  );
}

export default App;