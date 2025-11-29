import { signData } from '@app/core/crypto/keyManagement';
import { IGameBlockChain, IStepBlock, TGameAction } from '../types';

export const createBlock = async (
  username: string,
  action: TGameAction,
  gameBlockchain: IGameBlockChain,
  privateKey: string
): Promise<IStepBlock> => {
  const previousBlock = gameBlockchain.blocks[gameBlockchain.blocks.length - 1];
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(action)));
  const hashBase64 = btoa(String.fromCharCode(...new Uint8Array(hash)));

  const signature = await signData(privateKey, JSON.stringify(action));

  return {
    username,
    action,
    hash: hashBase64,
    previousHash: previousBlock?.hash || undefined,
    signature,
  };
};
