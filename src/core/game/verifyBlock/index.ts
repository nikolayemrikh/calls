import { verifySignature } from '@app/core/crypto/keyManagement';
import { IStepBlock } from '../types';

export const verifyBlock = async (block: IStepBlock, publicKey: string): Promise<boolean> => {
  const verified = await verifySignature(block.signature, publicKey, JSON.stringify(block.action));
  return verified;
};
