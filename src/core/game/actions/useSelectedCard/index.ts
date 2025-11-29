import { IBoard } from '@app/core/game/types';
import { passTurnToNextUser } from '../../common/passTurnToNextUser';
import { removeCard } from '../../common/removeCard';
import { CARD_VARIANTS } from '../../constants';
import { EPower } from '../../enums';
import { TUseSelectedCardParams } from './types';

export const useSelectedCard = (params: TUseSelectedCardParams, board: IBoard): void => {
  const currentUsername = params.currentUsername;
  if (currentUsername !== board.turnUsername) throw new Error('Can not use card since it is not current user turn');

  const openedCardNumberToUse = board.openedCardNumberToUse;
  if (!openedCardNumberToUse) throw new Error('No card to use since "opened_card_number_to_use" is not set');

  const cardVariant = CARD_VARIANTS.find((cardVariant) => cardVariant.number === openedCardNumberToUse);
  if (!cardVariant) throw new Error(`Card variant not found for card with number "${openedCardNumberToUse}"`);

  const power = cardVariant.power;

  const resPower = params.power;
  if (resPower !== power)
    throw new Error(`Can not use card with power "${power}" when power "${resPower}" is requested`);

  const cardTower = board.towers[currentUsername];
  if (!cardTower) throw new Error('Card tower for current user not found');

  const cardsInTower = cardTower.cards;

  // move used opened card to discard pile
  board.discardedCardNumbers.push(openedCardNumberToUse);

  switch (resPower) {
    case EPower.Protect: {
      if (Math.abs(params.fisrtCardIndex - params.secondCardIndex) !== 1)
        throw new Error('Can not protect cards that are not next to each other');
      const firstCard = cardsInTower[params.fisrtCardIndex];
      const secondCard = cardsInTower[params.secondCardIndex];
      firstCard.isProtected = true;
      secondCard.isProtected = true;
      break;
    }
    case EPower.SwapNeighbours: {
      if (Math.abs(params.fisrtCardIndex - params.secondCardIndex) !== 1)
        throw new Error('Can not swap cards that are not next to each other');
      const firstCard = cardsInTower[params.fisrtCardIndex];
      const secondCard = cardsInTower[params.secondCardIndex];
      const tempCardNumber = firstCard.number;
      firstCard.number = secondCard.number;
      secondCard.number = tempCardNumber;
      break;
    }
    case EPower.SwapThroughOne: {
      if (Math.abs(params.fisrtCardIndex - params.secondCardIndex) !== 2)
        throw new Error('Can not swap cards that are not next to each other through one card');
      const firstCard = cardsInTower[params.fisrtCardIndex];
      const secondCard = cardsInTower[params.secondCardIndex];
      const tempCardNumber = firstCard.number;
      firstCard.number = secondCard.number;
      secondCard.number = tempCardNumber;
      break;
    }
    case EPower.MoveDownByTwo: {
      const card = cardsInTower[params.cardIndex];
      const nextCard1 = cardsInTower[params.cardIndex - 1];
      const nextCard2 = cardsInTower[params.cardIndex - 2];
      if (!nextCard1 || !nextCard2)
        throw new Error('Can not move down by two cards because there are not enough cards below');
      const tempCardNumber = card.number;
      card.number = nextCard1.number;
      nextCard1.number = nextCard2.number;
      nextCard2.number = tempCardNumber;
      break;
    }
    case EPower.MoveUpByTwo: {
      const card = cardsInTower[params.cardIndex];
      const nextCard1 = cardsInTower[params.cardIndex + 1];
      const nextCard2 = cardsInTower[params.cardIndex + 2];
      if (!nextCard1 || !nextCard2)
        throw new Error('Can not move up by two cards because there are not enough cards above');
      const tempCardNumber = card.number;
      card.number = nextCard1.number;
      nextCard1.number = nextCard2.number;
      nextCard2.number = tempCardNumber;
      break;
    }
    case EPower.RemoveTop: {
      removeCard(board, currentUsername, cardsInTower.length - 1);
      break;
    }
    case EPower.RemoveMiddle: {
      removeCard(board, currentUsername, (cardsInTower.length - 1) / 2);
      break;
    }
    case EPower.RemoveBottom: {
      removeCard(board, currentUsername, 0);
      break;
    }
    default: {
      const unhandledPower: never = resPower;
      throw new Error(`Unhandled power "${unhandledPower}"`);
    }
  }

  board.openedCardNumberToUse = null;

  passTurnToNextUser(board, currentUsername);
};
