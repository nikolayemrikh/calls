export const CRYPTO_KEY_PARAMS = {
  name: 'ECDSA',
  namedCurve: 'P-256',
};

export const CRYPTO_SIGNATURE_PARAMS = {
  name: CRYPTO_KEY_PARAMS.name,
  hash: { name: 'SHA-256' },
};
