import { IGame, IStepBlock } from '../game/types';
import { EPeerEventType } from './enums';

export interface IPeerBaseEvent {
  type: EPeerEventType;
  data: unknown;
}

export interface IInitializeGameEvent extends IPeerBaseEvent {
  type: EPeerEventType.initializeGame;
  data: IGame;
}

export interface IActionEvent extends IPeerBaseEvent {
  type: EPeerEventType.action;
  data: IStepBlock;
}

export interface IAfterConnectionStartedCheckEventData {
  lastBlockHash: string | undefined;
}

export interface IAfterConnectionStartedCheckEvent extends IPeerBaseEvent {
  type: EPeerEventType.afterConnectionStartedCheck;
  data: IAfterConnectionStartedCheckEventData;
}

export interface IPublicKeyEventData {
  publicKey: string;
}

export interface IPublicKeyEvent extends IPeerBaseEvent {
  type: EPeerEventType.publicKey;
  data: IPublicKeyEventData;
}

export interface IInitializeChatEventData {
  id: string;
  usernames: string[];
}

export interface IInitializeVideoEventData {
  id: string;
  usernames: string[];
}

export interface IInitializeChatEvent extends IPeerBaseEvent {
  type: EPeerEventType.initializeChat;
  data: IInitializeChatEventData;
}

export interface IInitializeVideoEvent extends IPeerBaseEvent {
  type: EPeerEventType.initializeVideo;
  data: IInitializeVideoEventData;
}

export type TPeerEvent =
  | IInitializeGameEvent
  | IActionEvent
  | IAfterConnectionStartedCheckEvent
  | IPublicKeyEvent
  | IInitializeChatEvent
  | IInitializeVideoEvent;
