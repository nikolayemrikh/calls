export const getIceServers = (): RTCIceServer[] => [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: [
      `turn:${import.meta.env.VITE_TURN_SERVER_HOST}:${import.meta.env.VITE_TURN_SERVER_PORT}`,
      `turn:${import.meta.env.VITE_TURN_SERVER_HOST}:${import.meta.env.VITE_TURN_SERVER_PORT}?transport=tcp`,
      `turns:${import.meta.env.VITE_TURN_SERVER_HOST}:${import.meta.env.VITE_TURN_S_SERVER_PORT}?transport=tcp`,
    ],
    username: import.meta.env.VITE_TURN_SERVER_USERNAME,
    credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
  },
];
