import { IBoard } from '../../types';

export const passTurnToNextUser = (board: IBoard, currentUsername: string): void => {
  const players = Object.keys(board.towers);

  const currentPlayerIndex = players.findIndex((player) => player === currentUsername);

  const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;

  board.turnUsername = players[nextPlayerIndex];
};
