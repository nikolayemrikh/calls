export const getIceServers = () => [
  { url: 'stun:stun.l.google.com:19302' },
  {
    url: `turns:${import.meta.env.VITE_TURN_SERVER_HOST}:${import.meta.env.VITE_TURN_SERVER_PORT}`,
    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
  },
];
