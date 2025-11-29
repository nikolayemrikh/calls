import { passTurnToNextUser } from '../../common/passTurnToNextUser/index.ts';
import { removeOpenCardDuplicates } from '../../common/removeOpenCardDuplicates/index.ts';
import { IBoard } from '../../types';
import { IChangeCardToPulledParams } from './types';

export const changeCardToPulled = (params: IChangeCardToPulledParams, board: IBoard) => {
  const { index, currentUsername } = params;

  if (board.turnUsername !== currentUsername) throw new Error('Turn user is not current user');

  const cardTower = board.towers[board.turnUsername];
  if (!cardTower) throw new Error('Card tower for current user not found');

  if (board.openedCardNumberToUse !== null)
    throw new Error('Can not change card to pulled from the deck when opened card number has already been set');

  const pulledCardNumberToChange = board.pulledCardNumberToChange;
  if (pulledCardNumberToChange === null)
    throw new Error('Can not chage card when "pulledCardNumberToChange" is not set');

  const cardToOpenNumber = cardTower.cards[index].number;
  cardTower.cards[index].number = pulledCardNumberToChange;
  cardTower.cards[index].isProtected = false;

  board.pulledCardNumberToChange = null;
  board.openCardNumbers.push(cardToOpenNumber);

  removeOpenCardDuplicates(board);

  passTurnToNextUser(board, currentUsername);
};
