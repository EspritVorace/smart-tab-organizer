// Shared message types for communication between background and content scripts

export interface MiddleClickMessage {
  type: 'middleClickLink';
  url: string;
}

export interface AskGroupNameMessage {
  type: 'askGroupName';
  defaultName: string;
}

export interface GroupNameResponse {
  name: string | null;
}

export interface MessageResponse {
  status: 'received' | 'error';
  message?: string;
}

// Union types for different contexts
export type ContentMessage = MiddleClickMessage | AskGroupNameMessage;
export type BackgroundMessage = MiddleClickMessage;