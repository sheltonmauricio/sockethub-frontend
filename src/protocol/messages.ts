import { MessageType } from "./message-types";

export interface User {
  id: number;
  username: string;
}

export interface Group {
  id: number;
  name: string;
  ownerId: number;
}

export interface GroupSummary {
  id: number;
  name: string;
  role: "OWNER" | "MEMBER" | null;
}

export interface GroupMember {
  userId: number;
  username: string;
}

export interface ChatMessage {
  id: number;
  groupId: number;
  sender: {
    id: number;
    username: string;
  };
  content: string;
  createdAt: string;
}

/* -------------------- Base -------------------- */

export interface BaseRequest {
  type: MessageType;
  requestId: string;
}

export interface ErrorResponse {
  type: MessageType.ERROR;
  requestId?: string;
  payload: {
    code: string;
    message: string;
  };
}

/* -------------------- Authentication -------------------- */

export interface LoginRequest extends BaseRequest {
  type: MessageType.LOGIN;
  payload: {
    username: string;
    password: string;
  };
}

export interface LoginResponse {
  type: MessageType.LOGIN_RESPONSE;
  requestId: string;
  success: boolean;
  payload?: {
    user: User;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LogoutRequest extends BaseRequest {
  type: MessageType.LOGOUT;
  payload: {};
}

export interface LogoutResponse {
  type: MessageType.LOGOUT_RESPONSE;
  requestId?: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/* -------------------- Groups -------------------- */

export interface GetGroupsRequest extends BaseRequest {
  type: MessageType.GET_GROUPS;
  payload: {};
}

export interface GetGroupsResponse {
  type: MessageType.GET_GROUPS_RESPONSE;
  requestId: string;
  success: boolean;
  payload?: {
    groups: GroupSummary[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface CreateGroupRequest extends BaseRequest {
  type: MessageType.CREATE_GROUP;
  payload: {
    name: string;
  };
}

export interface CreateGroupResponse {
  type: MessageType.CREATE_GROUP_RESPONSE;
  requestId: string;
  success: boolean;
  payload?: {
    group: Group;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface GroupRequest extends BaseRequest {
  type:
    | MessageType.DELETE_GROUP
    | MessageType.JOIN_GROUP
    | MessageType.LEAVE_GROUP;

  payload: {
    groupId: number;
  };
}

export interface DeleteGroupRequest extends BaseRequest {
  type: MessageType.DELETE_GROUP;
  payload: {
    groupId: number;
  };
}

export interface DeleteGroupResponse {
  type: MessageType.DELETE_GROUP_RESPONSE;
  requestId: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface JoinGroupRequest extends BaseRequest {
  type: MessageType.JOIN_GROUP;
  payload: {
    groupId: number;
  };
}

export interface JoinGroupResponse {
  type: MessageType.JOIN_GROUP_RESPONSE;
  requestId: string;
  success: boolean;
  payload?: {
    group: Group;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface LeaveGroupRequest extends BaseRequest {
  type: MessageType.LEAVE_GROUP;
  payload: {
    groupId: number;
  };
}

export interface LeaveGroupResponse {
  type: MessageType.LEAVE_GROUP_RESPONSE;
  requestId: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface MemberRequest extends BaseRequest {
  type:
    | MessageType.ADD_MEMBER
    | MessageType.REMOVE_MEMBER;

  payload: {
    groupId: number;
    userId: number;
  };
}

export interface AddMemberRequest extends BaseRequest {
  type: MessageType.ADD_MEMBER;
  payload: {
    groupId: number;
    userId: number;
  };
}

export interface AddMemberResponse {
  type: MessageType.ADD_MEMBER_RESPONSE;
  requestId: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface RemoveMemberRequest extends BaseRequest {
  type: MessageType.REMOVE_MEMBER;
  payload: {
    groupId: number;
    userId: number;
  };
}

export interface RemoveMemberResponse {
  type: MessageType.REMOVE_MEMBER_RESPONSE;
  requestId: string;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

/* -------------------- Messages -------------------- */

export interface GetMessagesRequest extends BaseRequest {
  type: MessageType.GET_MESSAGES;
  payload: {
    groupId: number;
    limit: number;
    offset: number;
  };
}

export interface GetMessagesResponse {
  type: MessageType.GET_MESSAGES_RESPONSE;
  requestId: string;
  success: boolean;
  payload?: {
    messages: ChatMessage[];
    hasMore: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SendMessageRequest extends BaseRequest {
  type: MessageType.SEND_MESSAGE;
  payload: {
    groupId: number;
    content: string;
  };
}

export interface SendMessageResponse {
  type: MessageType.SEND_MESSAGE_RESPONSE;
  requestId: string;
  success: boolean;
  payload?: {
    messageId: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface NewMessage {
  type: MessageType.NEW_MESSAGE;
  payload: {
    message: ChatMessage;
  };
}

/* -------------------- Heartbeat -------------------- */

export interface PingMessage {
  type: MessageType.PING;
}

export interface PongMessage {
  type: MessageType.PONG;
}

/* -------------------- Protocol -------------------- */

export type ProtocolMessage =
  | LoginRequest
  | LogoutRequest
  | GetGroupsRequest
  | CreateGroupRequest
  | DeleteGroupRequest
  | JoinGroupRequest
  | LeaveGroupRequest
  | AddMemberRequest
  | RemoveMemberRequest
  | GetMessagesRequest
  | SendMessageRequest
  | PingMessage
  | PongMessage;

export type ServerMessage =
  | LoginResponse
  | LogoutResponse
  | GetGroupsResponse
  | CreateGroupResponse
  | DeleteGroupResponse
  | JoinGroupResponse
  | LeaveGroupResponse
  | AddMemberResponse
  | RemoveMemberResponse
  | GetMessagesResponse
  | SendMessageResponse
  | NewMessage
  | PingMessage
  | PongMessage
  | ErrorResponse;