import { IChangeCardToPulledParams } from './actions/changeCardToPulled/types';
import { IPullCardParams } from './actions/pullCard/types';
import { ISelectOpenedCardParams } from './actions/selectOpenedCard/types';
import { TUseSelectedCardParams } from './actions/useSelectedCard/types';
import { EGameActionType, EPower } from './enums';
export interface ICardVariant {
  number: number;
  power: EPower;
}

export interface IPlayer {
  username: string;
  publicKey: string;
}

export interface IGame {
  id: string;
  players: IPlayer[];
  createdAt: Date;
  board: IBoard;
}

export interface ICard {
  number: number;
  power: EPower;
}

export interface ITower {
  cards: ITowerCard[];
}

export interface ITowerCard {
  number: number;
  isProtected: boolean;
}

export interface IBoard {
  towers: Record<string, ITower>;
  openCardNumbers: number[];
  pulledCardNumberToChange: number | null;
  openedCardNumberToUse: number | null;
  closedCardNumbers: number[];
  discardedCardNumbers: number[];
  turnUsername: string;
}

export interface IGameBlockChain {
  initialBoard: IBoard;
  players: IPlayer[];
  blocks: IStepBlock[];
}
export interface IBaseGameAction {
  type: EGameActionType;
}

export interface IUseCardActionParams extends IBaseGameAction {
  type: EGameActionType.UseCard;
  params: TUseSelectedCardParams;
}

export interface IPullCardActionParams extends IBaseGameAction {
  type: EGameActionType.PullCard;
  params: IPullCardParams;
}

export interface IChangeCardToPulledActionParams extends IBaseGameAction {
  type: EGameActionType.ChangeCardToPulled;
  params: IChangeCardToPulledParams;
}

export interface ISelectOpenedCardActionParams extends IBaseGameAction {
  type: EGameActionType.SelectOpenedCard;
  params: ISelectOpenedCardParams;
}

export type TGameAction =
  | IUseCardActionParams
  | IPullCardActionParams
  | IChangeCardToPulledActionParams
  | ISelectOpenedCardActionParams;

export interface IStepBlock {
  username: string;
  action: TGameAction;
  hash: string;
  previousHash: string | undefined;
  signature: string;
}
