import { ELocalStorageKey } from '../localStorage/constants';
import { CRYPTO_KEY_PARAMS, CRYPTO_SIGNATURE_PARAMS } from './constants';

export interface IKeyPair {
  publicKey: string;
  privateKey: string;
}

export const generateKeys = async (): Promise<CryptoKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(CRYPTO_KEY_PARAMS, true, ['sign', 'verify']);

  return keyPair;
};

export const exportKeys = async (keyPair: CryptoKeyPair): Promise<IKeyPair> => {
  const publicKeyString = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyString = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  return {
    publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKeyString))),
    privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKeyString))),
  };
};

export const importPublicKey = async (publicKey: string): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    'spki',
    Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0)),
    CRYPTO_KEY_PARAMS,
    true,
    ['verify']
  );
};

export const importPrivateKey = async (privateKey: string): Promise<CryptoKey> => {
  return await crypto.subtle.importKey(
    'pkcs8',
    Uint8Array.from(atob(privateKey), (c) => c.charCodeAt(0)),
    CRYPTO_KEY_PARAMS,
    true,
    ['sign']
  );
};

export const storeKeys = (keyPair: IKeyPair): void => {
  localStorage.setItem(ELocalStorageKey.PublicKey, keyPair.publicKey);
  localStorage.setItem(ELocalStorageKey.PrivateKey, keyPair.privateKey);
};

export const getStoredKeys = (): IKeyPair | null => {
  const publicKey = localStorage.getItem(ELocalStorageKey.PublicKey);
  const privateKey = localStorage.getItem(ELocalStorageKey.PrivateKey);

  if (!publicKey || !privateKey) {
    return null;
  }

  return {
    publicKey,
    privateKey,
  };
};

export const signData = async (privateKey: string, data: string): Promise<string> => {
  const importedPrivateKey = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    CRYPTO_SIGNATURE_PARAMS,
    importedPrivateKey,
    new TextEncoder().encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
};

export const verifySignature = async (signature: string, publicKey: string, data: string): Promise<boolean> => {
  const importedPublicKey = await importPublicKey(publicKey);
  const signatureArray = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  const verified = await crypto.subtle.verify(
    CRYPTO_SIGNATURE_PARAMS,
    importedPublicKey,
    signatureArray,
    new TextEncoder().encode(data)
  );
  return verified;
};
