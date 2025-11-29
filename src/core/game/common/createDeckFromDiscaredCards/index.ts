import { CARD_VARIANTS } from '../../constants';
import { IBoard } from '../../types';

import { ICardVariant } from '../../types';

export const createDeckFromDiscaredCards = (board: IBoard): void => {
  // shuffle cards in discard pile
  const cardsInBoardDiscardToReduce = [...board.discardedCardNumbers];
  const cardsToBoardDeck: ICardVariant[] = [];
  while (cardsInBoardDiscardToReduce.length > 0) {
    const randomIndex = Math.floor(Math.random() * cardsInBoardDiscardToReduce.length);
    const randomCardInBoardDiscard = cardsInBoardDiscardToReduce[randomIndex];
    const cardVariant = CARD_VARIANTS.find((cardVariant) => cardVariant.number === randomCardInBoardDiscard);
    if (!cardVariant) throw new Error(`Card variant not found for card with number "${randomCardInBoardDiscard}"`);
    cardsToBoardDeck.push({ number: randomCardInBoardDiscard, power: cardVariant.power });
    cardsInBoardDiscardToReduce.splice(randomIndex, 1);
  }

  // create cards in border deck
  for (const cardToBoardDeck of cardsToBoardDeck) {
    board.closedCardNumbers.push(cardToBoardDeck.number);
  }

  // remove cards in board discard
  board.discardedCardNumbers = [];
};
