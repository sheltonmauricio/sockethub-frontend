export type GroupRole =
  | "OWNER"
  | "MEMBER"
  | null;

export interface Group {
  id: number;
  name: string;
  role: GroupRole;
  ownerId?: number;
}