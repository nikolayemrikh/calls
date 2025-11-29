import { IBoard } from '@app/core/game/types';
import { ISelectOpenedCardParams } from './types';

export const selectOpenedCard = async (params: ISelectOpenedCardParams, board: IBoard): Promise<void> => {
  const currentUsername = params.currentUsername;
  if (currentUsername !== board.turnUsername)
    throw new Error('Can not select opened card because it is not current user turn');

  if (board.pulledCardNumberToChange) throw new Error('Can not select opened card since card has already been pulled');
  if (board.openedCardNumberToUse) throw new Error('Can not select opened card since it has already been selected');

  const cardInBoardNumberIndex = board.openCardNumbers.findIndex((cardNumber) => cardNumber === params.cardNumber);
  if (cardInBoardNumberIndex === -1) throw new Error(`Card with number "${params.cardNumber}" not found in board`);

  board.openedCardNumberToUse = board.openCardNumbers[cardInBoardNumberIndex];
  board.openCardNumbers.splice(cardInBoardNumberIndex, 1);
};
