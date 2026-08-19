import {useEffect, useRef, useState} from "react";
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
  ownerId: number;
  role?: "OWNER" | "MEMBER" | null;
}

interface Message {
  id: number;
  groupId: number;
  sender: {
    id: number;
    username: string;
  };
  content: string;
  createdAt: string;
}

function App() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [user, setUser] = useState<User | null>(null);

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] =
    useState<Group | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");

  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedGroupRef = useRef<Group | null>(null);

  /*
   * Mantém as mensagens em ordem cronológica:
   *
   * mais antiga
   *      ↓
   * ...
   *      ↓
   * mais recente
   */
  function sortMessages(
    messages: Message[]
  ): Message[] {
    return [...messages].sort((a, b) => {
      const dateA =
        new Date(a.createdAt).getTime();

      const dateB =
        new Date(b.createdAt).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      return a.id - b.id;
    });
  }

  /*
   * Faz o chat descer para a mensagem
   * mais recente.
   */
  function scrollToBottom(): void {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }

  /*
   * Formata a data/hora da mensagem.
   *
   * Hoje:
   * 14:35
   *
   * Outro dia:
   * 18/08/2026, 14:35
   */
  // function formatMessageDate(
  //   dateString: string
  // ): string {
  //   const date = new Date(dateString);

  //   if (Number.isNaN(date.getTime())) {
  //     return "";
  //   }

  //   const now = new Date();

  //   const isToday =
  //     date.getDate() === now.getDate() &&
  //     date.getMonth() === now.getMonth() &&
  //     date.getFullYear() ===
  //       now.getFullYear();

  //   if (isToday) {
  //     return date.toLocaleTimeString(
  //       "pt-PT",
  //       {
  //         hour: "2-digit",
  //         minute: "2-digit"
  //       }
  //     );
  //   }

  //   return date.toLocaleString("pt-PT", {
  //     day: "2-digit",
  //     month: "2-digit",
  //     year: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit"
  //   });
  // }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

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
            if (message.success) {
              setGroups(
                message.payload?.groups ?? []
              );
            } else {
              setError(
                message.error?.message ??
                  "Não foi possível carregar os grupos."
              );
            }

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
            setLoading(false);

            if (
              message.success &&
              message.payload?.group
            ) {
              const group =
                message.payload.group;

              setSelectedGroup(group);
              setMessages([]);
              setError("");

              void window.electronAPI.tcp.getMessages(
                group.id,
                20,
                0
              );

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
              setSelectedGroup(null);
              setMessages([]);
              setMessageInput("");

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
            message.type ===
            "GET_MESSAGES_RESPONSE"
          ) {
            if (message.success) {
              const receivedMessages = 
                message.payload?.messages ?? [];

              setMessages(
                sortMessages(receivedMessages)
              );
            } else {
              setError(
                message.error?.message ??
                  "Não foi possível carregar as mensagens."
              );
            }

            return;
          }

          if (message.type === "SEND_MESSAGE_RESPONSE") {
            if (!message.success) {
              setError(
                message.error?.message ??
                  "Não foi possível enviar a mensagem."
              );
            }

            return;
          }

  
          if (message.type === "NEW_MESSAGE") {
            const newMessage =
              message.payload?.message as
                | Message
                | undefined;

            if (!newMessage) {
              return;
            }

            const currentGroup =
              selectedGroupRef.current;

            if (
              !currentGroup ||
              newMessage.groupId !== currentGroup.id
            ) {
              return;
            }

            setMessages((previous) => {
              if (
                previous.some(
                  (item) => item.id === newMessage.id
                )
              ) {
                return previous;
              }

              return sortMessages([
                ...previous,
                newMessage
              ]);
            });

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

  /*
   * Sempre que as mensagens mudarem,
   * posiciona o chat na mensagem mais recente.
   */
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        scrollToBottom();
      });
    }
  }, [messages]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

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
    setSelectedGroup(null);
    setMessages([]);
    setMessageInput("");
    setError("");
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
    setLoading(true);

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

  function handleSelectGroup(
    group: Group
  ): void {
    setSelectedGroup(group);
    setMessages([]);
    setError("");

    void window.electronAPI.tcp.getMessages(
      group.id,
      20,
      0
    );
  }

  function handleSendMessage(
    event: React.FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    if (!selectedGroup) {
      return;
    }

    const content =
      messageInput.trim();

    if (!content) {
      return;
    }

    setError("");

    void window.electronAPI.tcp.send({
      type: "SEND_MESSAGE",
      requestId: crypto.randomUUID(),
      payload: {
        groupId: selectedGroup.id,
        content
      }
    });

    setMessageInput("");
  }

  function formatDateLabel(
    dateString: string
  ): string {
    return new Date(dateString)
      .toLocaleDateString(
        "pt-PT",
        {
          day: "2-digit",
          month: "long",
          year: "numeric"
        }
      );
  }

  const isConnected =
    connectionState === "connected";

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col p-6">

        <header className="mb-6 flex items-center justify-between">
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
                className="mt-1 text-sm text-red-400 transition hover:text-red-300"
              >
                Terminar sessão
              </button>
            </div>
          )}
        </header>

        {!user ? (
          <section className="mx-auto w-full max-w-md">
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
          </section>
        ) : (
          <section className="flex min-h-0 flex-1 flex-col">

            {error && (
              <div className="mb-4 rounded-md border border-red-900 bg-red-950/40 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="grid h-[calc(100vh-140px)] min-h-0 grid-cols-1 overflow-hidden rounded-lg border border-slate-800 bg-slate-900 md:grid-cols-[320px_1fr]"> 

              <aside className="border-b border-slate-800 md:border-b-0 md:border-r">

                <div className="border-b border-slate-800 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold">
                        Grupos
                      </h2>

                      <p className="text-xs text-slate-500">
                        {groups.length} grupo
                        {groups.length === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void window.electronAPI.tcp.getGroups()
                      }
                      className="rounded-md border border-slate-700 px-3 py-1.5 text-xs transition hover:bg-slate-800"
                    >
                      Atualizar
                    </button>
                  </div>

                  <form
                    onSubmit={handleCreateGroup}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={groupName}
                      onChange={(event) =>
                        setGroupName(
                          event.target.value
                        )
                      }
                      placeholder="Novo grupo"
                      className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-500"
                    >
                      Criar
                    </button>
                  </form>
                </div>

                <div className="max-h-[500px] overflow-y-auto">
                  {groups.length === 0 ? (
                    <div className="p-6 text-center">
                      <p className="text-sm text-slate-400">
                        Nenhum grupo encontrado.
                      </p>
                    </div>
                  ) : (
                    groups.map((group) => {
                      const isSelected =
                        selectedGroup?.id ===
                        group.id;

                      const isMember =
                        group.role ===
                          "OWNER" ||
                        group.role ===
                          "MEMBER";

                      return (
                        <div
                          key={group.id}
                          className={`border-b border-slate-800 p-4 transition ${
                            isSelected
                              ? "bg-slate-800"
                              : "hover:bg-slate-800/50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleSelectGroup(
                                group
                              )
                            }
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="truncate font-medium">
                                  {group.name}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  Grupo #{group.id}
                                </p>
                              </div>

                              {group.role && (
                                <span className="shrink-0 text-xs text-blue-400">
                                  {group.role ===
                                  "OWNER"
                                    ? "Dono"
                                    : "Membro"}
                                </span>
                              )}
                            </div>
                          </button>

                          <div className="mt-3 flex gap-2">
                            {!isMember && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleJoinGroup(
                                    group.id
                                  )
                                }
                                className="flex-1 rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium transition hover:bg-green-500"
                              >
                                Entrar
                              </button>
                            )}

                            {isMember && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleLeaveGroup(
                                    group.id
                                  )
                                }
                                className="flex-1 rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium transition hover:bg-red-500"
                              >
                                Sair
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </aside>

              <section className="flex min-h-0 h-full flex-col overflow-hidden">

                {!selectedGroup ? (
                  <div className="flex flex-1 items-center justify-center p-8 text-center">
                    <div>
                      <h2 className="text-xl font-semibold">
                        Selecione um grupo
                      </h2>

                      <p className="mt-2 max-w-sm text-sm text-slate-400">
                        Selecione um grupo na lista
                        para visualizar as mensagens.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <header className="border-b border-slate-800 p-4">
                      <div className="flex  items-center justify-between">
                        <div>
                          <h2 className="font-semibold">
                            {selectedGroup.name}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            Grupo #{selectedGroup.id}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleLeaveGroup(
                              selectedGroup.id
                            )
                          }
                          className="rounded-md border border-red-900 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-950"
                        >
                          Sair
                        </button>
                      </div>
                    </header>

                    <div
                      id="messages-container"
                      className="min-h-0 flex-1 overflow-y-auto p-4"
                    >
                      {messages.length === 0 ? (
                        <div className="flex h-full items-center justify-center text-center">
                          <div>
                            <p className="text-slate-400">
                              Nenhuma mensagem.
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Envie a primeira mensagem
                              do grupo.
                            </p>
                          </div>
                        </div>
                      ) : (
                        
                        <div className="space-y-3">
                          {messages.map((message, index) => {
                            const ownMessage =
                              message.sender.id === user?.id;

                            const currentDate =
                              message.createdAt
                                ? formatDateLabel(
                                    message.createdAt
                                  )
                                : "";

                            const previousDate =
                              index > 0 &&
                              messages[index - 1].createdAt
                                ? formatDateLabel(
                                    messages[index - 1]
                                      .createdAt!
                                  )
                                : "";

                            const showDate =
                              currentDate !== previousDate;

                            return (
                              <div key={message.id}>
                                {showDate && (
                                  <div className="my-4 flex justify-center">
                                    <span className="rounded-full bg-slate-800 px-4 py-1 text-xs text-slate-400">
                                      {currentDate}
                                    </span>
                                  </div>
                                )}

                                <div
                                  className={`flex ${
                                    ownMessage
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                                      ownMessage
                                        ? "bg-blue-600"
                                        : "bg-slate-800"
                                    }`}
                                  >
                                    {!ownMessage &&
                                      message.sender.username && (
                                        <p className="mb-1 text-xs font-medium text-slate-400">
                                          {message.sender.username}
                                        </p>
                                      )}

                                    <p className="break-words text-sm">
                                      {message.content}
                                    </p>

                                    {message.createdAt && (
                                      <p className="mt-1 text-right text-[10px] opacity-60">
                                        {new Date(
                                          message.createdAt
                                        ).toLocaleTimeString(
                                          "pt-PT",
                                          {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                          }
                                        )}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          <div ref={messagesEndRef} />
                        </div>

                      )}
                    </div>

                    <form
                      onSubmit={
                        handleSendMessage
                      }
                      className="border-t border-slate-800 p-4"
                    >
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={
                            messageInput
                          }
                          onChange={(event) =>
                            setMessageInput(
                              event.target.value
                            )
                          }
                          placeholder="Escreva uma mensagem..."
                          className="flex-1 rounded-md border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                        />

                        <button
                          type="submit"
                          disabled={
                            !messageInput.trim()
                          }
                          className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </section>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

export default App;