import { IBoard } from '../../types';
import { createDeckFromDiscaredCards } from '../createDeckFromDiscaredCards';
import { removeOpenCardDuplicates } from '../removeOpenCardDuplicates';

export const removeCard = (board: IBoard, startFromUsername: string, cardIndex: number): void => {
  const players = Object.keys(board.towers);
  const startTowerIndex = players.findIndex((player) => player === startFromUsername);
  const playersStartingFromStartTowerIndex = players.slice(startTowerIndex).concat(players.slice(0, startTowerIndex));

  for (const player of playersStartingFromStartTowerIndex) {
    const cardTower = board.towers[player];
    const cardInTowerToUpdate = cardTower.cards[cardIndex];
    if (cardInTowerToUpdate.isProtected) continue;

    let cardsInBoardDeck = board.closedCardNumbers;
    if (!cardsInBoardDeck.length) {
      createDeckFromDiscaredCards(board);
      cardsInBoardDeck = board.closedCardNumbers;
    }
    const cardNumberFromBoardDeck = cardsInBoardDeck.pop();

    if (!cardNumberFromBoardDeck) throw new Error('Deck should not be empty');

    const removedCardNumber = cardInTowerToUpdate.number;
    // update card in card tower
    cardInTowerToUpdate.number = cardNumberFromBoardDeck;
    cardInTowerToUpdate.isProtected = false;

    // move card from card tower to opened pile
    board.openCardNumbers.push(removedCardNumber);
  }

  removeOpenCardDuplicates(board);
};
