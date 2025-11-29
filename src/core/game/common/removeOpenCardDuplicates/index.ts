import { CARD_VARIANTS_MAP } from '../../constants';
import { EPower } from '../../enums';
import { IBoard } from '../../types';

/**
 * Сокращаются карты в открытой колоде, если они имеют одинаковые способности
 * Сократиться может только четное количество карт
 */
export const removeOpenCardDuplicates = (board: IBoard): void => {
  const openCardNumbersWithPowers = board.openCardNumbers.map((cardNumber, index) => ({
    index,
    number: cardNumber,
    power: CARD_VARIANTS_MAP[cardNumber],
  }));

  for (const power of Object.values(EPower)) {
    const cardsOfPower = openCardNumbersWithPowers.filter((cardVariant) => cardVariant.power === power);
    if (cardsOfPower.length < 2) continue;

    const isEven = cardsOfPower.length % 2 === 0;
    const cardsToRemove = cardsOfPower.slice(0, cardsOfPower.length - (isEven ? 0 : 1));
    board.discardedCardNumbers.push(...cardsToRemove.map((cardVariant) => cardVariant.number));

    for (const cardToRemove of [...cardsToRemove].reverse()) {
      board.openCardNumbers.splice(cardToRemove.index, 1);
    }
  }
};
