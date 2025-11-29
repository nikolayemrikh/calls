import { IGameBlockChain, IStepBlock } from '../types';

export const validateBlock = (gameBlockchain: IGameBlockChain, block: IStepBlock): boolean => {
  const previousBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
  return block?.previousHash === previousBlock?.hash;
};
