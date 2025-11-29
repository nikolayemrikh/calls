import { IBoard } from '../../types.ts';
import { IPullCardParams } from './types.ts';

export const pullCard = async (params: IPullCardParams, board: IBoard): Promise<void> => {
  const { currentUsername } = params;
  if (board.turnUsername !== currentUsername) throw new Error('Turn user is not current user');

  if (board.openedCardNumberToUse) throw new Error('Can not pull card when opened card number has already been set');
  if (board.pulledCardNumberToChange)
    throw new Error('Can not pull card when card has already been pulled from the deck');

  if (board.closedCardNumbers.length === 0) throw new Error('Deck should not be empty');

  const cardFromBoardDeck = board.closedCardNumbers.pop();
  if (!cardFromBoardDeck) throw new Error('Deck should not be empty');

  board.pulledCardNumberToChange = cardFromBoardDeck;

  // await notifyBoardStateChanged(boardId);
};
