import { ICard } from '../types';

import { ICardVariant, ITower, ITowerCard } from '../types';

import { CARD_VARIANTS } from '../constants';
import { IBoard } from '../types';

export const createBoard = (players: string[]): IBoard => {
  const cardVariantsToReduce = [...CARD_VARIANTS];
  const cardsInBoardDeck: ICardVariant[] = [];

  while (cardVariantsToReduce.length > 0) {
    const randomIndex = Math.floor(Math.random() * cardVariantsToReduce.length);
    const randomCardVariant = cardVariantsToReduce[randomIndex];
    cardsInBoardDeck.push(randomCardVariant);
    cardVariantsToReduce.splice(randomIndex, 1);
  }

  const cardTowers: Record<string, ITower> = {};

  for (const player of players) {
    const newCardTower: ITowerCard[] = [];
    for (let i = 0; i < 7; i++) {
      newCardTower.push({ number: cardsInBoardDeck.shift()!.number, isProtected: false });
    }
    newCardTower.sort((a, b) => a.number - b.number);
    cardTowers[player] = { cards: newCardTower };
  }

  // create cards in border deck
  const cardsInBorderDeck: ICard[] = [];
  for (let i = 0; i < 10; i++) {
    cardsInBorderDeck.push(cardsInBoardDeck.shift()!);
  }

  return {
    towers: cardTowers,
    pulledCardNumberToChange: null,
    openedCardNumberToUse: null,
    openCardNumbers: [],
    closedCardNumbers: cardsInBoardDeck.map((card) => card.number),
    discardedCardNumbers: [],
    turnUsername: players[Math.floor(Math.random() * players.length)],
  };
};
