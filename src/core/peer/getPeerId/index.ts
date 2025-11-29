import { PEER_ID_SEPARATOR, PEER_PREFIX } from '../constants';

export const getPeerId = (pagePrefix: string, username: string) =>
  PEER_PREFIX + pagePrefix + PEER_ID_SEPARATOR + username;
