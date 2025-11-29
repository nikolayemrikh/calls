import { EPower } from '../../enums';

export type TUseSelectedCardParams =
  | IUseSelectedProtectCardParams
  | IUseSelectedRemoveTopCardParams
  | IUseSelectedRemoveMiddleCardParams
  | IUseSelectedRemoveBottomCardParams
  | IUseSelectedSwapNeighboursCardParams
  | IUseSelectedSwapThroughOneCardParams
  | IUseSelectedMoveDownByTwoCardParams
  | IUseSelectedMoveUpByTwoCardParams;

interface IBaseUseSelectedCardParams {
  currentUsername: string;
  power: EPower;
  boardId: string;
}

export interface IUseSelectedProtectCardParams extends IBaseUseSelectedCardParams {
  power: EPower.Protect;
  fisrtCardIndex: number;
  secondCardIndex: number;
}

export interface IUseSelectedRemoveTopCardParams extends IBaseUseSelectedCardParams {
  power: EPower.RemoveTop;
}

export interface IUseSelectedRemoveMiddleCardParams extends IBaseUseSelectedCardParams {
  power: EPower.RemoveMiddle;
}

export interface IUseSelectedRemoveBottomCardParams extends IBaseUseSelectedCardParams {
  power: EPower.RemoveBottom;
}

export interface IUseSelectedRemoveBottomCardParams extends IBaseUseSelectedCardParams {
  power: EPower.RemoveBottom;
}

export interface IUseSelectedSwapNeighboursCardParams extends IBaseUseSelectedCardParams {
  power: EPower.SwapNeighbours;
  fisrtCardIndex: number;
  secondCardIndex: number;
}

export interface IUseSelectedSwapThroughOneCardParams extends IBaseUseSelectedCardParams {
  power: EPower.SwapThroughOne;
  fisrtCardIndex: number;
  secondCardIndex: number;
}

export interface IUseSelectedMoveDownByTwoCardParams extends IBaseUseSelectedCardParams {
  power: EPower.MoveDownByTwo;
  cardIndex: number;
}

export interface IUseSelectedMoveUpByTwoCardParams extends IBaseUseSelectedCardParams {
  power: EPower.MoveUpByTwo;
  cardIndex: number;
}
