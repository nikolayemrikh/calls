import { EPower } from '../../enums';
import { ITowerCard } from '../../types';

export const checkIsUserCardAvailableForInitialAction = (
  index: number,
  isProtected: boolean,
  selectedOpenedCardPower: EPower,
  cards: ITowerCard[]
): boolean => {
  switch (selectedOpenedCardPower) {
    case EPower.Protect:
      return !isProtected && (cards[index + 1]?.isProtected === false || cards[index - 1]?.isProtected === false);
    case EPower.RemoveTop:
      return index === cards.length - 1;
    case EPower.RemoveMiddle:
      return index === (cards.length - 1) / 2;
    case EPower.RemoveBottom:
      return index === 0;
    case EPower.SwapNeighbours:
      return !isProtected && (cards[index + 1]?.isProtected === false || cards[index - 1]?.isProtected === false);
    case EPower.SwapThroughOne:
      return !isProtected && (cards[index + 2]?.isProtected === false || cards[index - 2]?.isProtected === false);
    case EPower.MoveUpByTwo:
      return !isProtected && cards[index + 1]?.isProtected === false && cards[index + 2]?.isProtected === false;
    case EPower.MoveDownByTwo:
      return !isProtected && cards[index - 1]?.isProtected === false && cards[index - 2]?.isProtected === false;
    default: {
      const unhandledPower: never = selectedOpenedCardPower;
      throw new Error(`Unhandled power "${unhandledPower}"`);
    }
  }
};
