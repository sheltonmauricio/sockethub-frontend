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

interface Group {
  id: number;
  name: string;
  ownerId?: number;
  memberCount?: number;
}

function App() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const [groupName, setGroupName] = useState("");
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
            JSON.stringify(message, null, 2)
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

              void window.electronAPI.tcp.getGroups();

              return;
            }

            setError(
              message.error?.message ??
                "Falha na autenticação."
            );

            return;
          }

          if (
            message.type ===
            "GET_GROUPS_RESPONSE"
          ) {
            setGroups(
              (message.payload?.groups ??
                []) as Group[]
            );

            return;
          }

          if (
            message.type ===
            "CREATE_GROUP_RESPONSE"
          ) {
            if (message.success) {
              setGroupName("");
              setError("");

              void window.electronAPI.tcp.getGroups();

              return;
            }

            setError(
              message.error?.message ??
                "Não foi possível criar o grupo."
            );

            return;
          }

          if (
            message.type ===
            "JOIN_GROUP_RESPONSE"
          ) {
            if (message.success) {
              setError("");

              void window.electronAPI.tcp.getGroups();

              return;
            }

            setError(
              message.error?.message ??
                "Não foi possível entrar no grupo."
            );

            return;
          }

          if (
            message.type ===
            "LEAVE_GROUP_RESPONSE"
          ) {
            if (message.success) {
              setError("");

              void window.electronAPI.tcp.getGroups();

              return;
            }

            setError(
              message.error?.message ??
                "Não foi possível sair do grupo."
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

    void window.electronAPI.tcp.login(
      username.trim(),
      password
    );
  }

  function handleLogout(): void {
    void window.electronAPI.tcp.send({
      type: "LOGOUT",
      requestId: crypto.randomUUID(),
      payload: {}
    });

    setUser(null);
    setGroups([]);
  }

  function handleCreateGroup(
    event: React.FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    const name = groupName.trim();

    if (!name) {
      setError(
        "Informe o nome do grupo."
      );

      return;
    }

    setError("");

    void window.electronAPI.tcp.createGroup(
      name
    );
  }

  function handleJoinGroup(
    groupId: number
  ): void {
    setError("");

    void window.electronAPI.tcp.joinGroup(
      groupId
    );
  }

  function handleLeaveGroup(
    groupId: number
  ): void {
    setError("");

    void window.electronAPI.tcp.leaveGroup(
      groupId
    );
  }

  const isConnected =
    connectionState === "connected";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto w-full max-w-5xl p-6">

        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              SocketHub
            </h1>

            <p className="mt-1 text-slate-400">
              Sistema de mensagens distribuído
            </p>
          </div>

          {user && (
            <div className="text-right">
              <p className="font-medium">
                {user.username}
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 text-sm text-red-400 hover:text-red-300"
              >
                Terminar sessão
              </button>
            </div>
          )}
        </header>

        {!user ? (
          <section className="mx-auto max-w-md">

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
          </section>
        ) : (
          <section>

            {error && (
              <div className="mb-6 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  Criar grupo
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Crie um grupo para iniciar uma conversa.
                </p>
              </div>

              <form
                onSubmit={handleCreateGroup}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={groupName}
                  onChange={(event) =>
                    setGroupName(
                      event.target.value
                    )
                  }
                  placeholder="Nome do grupo"
                  className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-5 py-2 font-medium hover:bg-blue-500"
                >
                  Criar
                </button>
              </form>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">
                    Grupos
                  </h2>

                  <p className="mt-1 text-sm text-slate-400">
                    Grupos disponíveis no servidor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void window.electronAPI.tcp.getGroups()
                  }
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:bg-slate-800"
                >
                  Atualizar
                </button>
              </div>

              {groups.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-700 p-8 text-center">
                  <p className="text-slate-400">
                    Nenhum grupo encontrado.
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Crie o primeiro grupo acima.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <article
                      key={group.id}
                      className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950 p-4"
                    >
                      <div>
                        <h3 className="font-medium">
                          {group.name}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          ID: {group.id}
                          {group.memberCount !==
                            undefined &&
                            ` • ${group.memberCount} membros`}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleJoinGroup(
                              group.id
                            )
                          }
                          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium hover:bg-green-500"
                        >
                          Entrar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleLeaveGroup(
                              group.id
                            )
                          }
                          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium hover:bg-red-500"
                        >
                          Sair
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;