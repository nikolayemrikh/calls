import { PEER_ID_SEPARATOR, PEER_PREFIX } from '../constants';

export const getUsernameFromPeerId = (pagePrefix: string, peerId: string) =>
  peerId.split(PEER_PREFIX + pagePrefix + PEER_ID_SEPARATOR)[1];
