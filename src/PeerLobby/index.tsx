import { routes } from '@app/Routes/routes';
import { PageMain } from '@app/components/PageMain';
import { exportKeys, generateKeys, getStoredKeys, storeKeys } from '@app/core/crypto/keyManagement';
import { createBoard } from '@app/core/game/createBoard';
import { IGame, IGameBlockChain } from '@app/core/game/types';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { EPeerEventType } from '@app/core/peer/enums';
import { getPeerId } from '@app/core/peer/getPeerId';
import { getUsernameFromPeerId } from '@app/core/peer/getUsernameFromPeerId';
import { IPublicKeyEvent, TPeerEvent } from '@app/core/peer/types';
import { Button, Card, Stack, TextField, Typography } from '@mui/material';
import { produce } from 'immer';
import Peer, { DataConnection } from 'peerjs';
import { FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { P, match } from 'ts-pattern';
import { v4 as uuid } from 'uuid';

const PAGE_PREFIX = 'lobby';

export const PeerLobby: FC = () => {
  // const { id } = useParams();
  // const [peer, setPeer] = useState<Peer | null>(null);
  const navigate = useNavigate();
  const [keyPair, setKeyPair] = useState<Record<'publicKey' | 'privateKey', string> | null>(() => getStoredKeys());
  const { publicKey } = keyPair ?? {};

  useEffect(() => {
    if (!keyPair) {
      const initializeKeys = async (): Promise<void> => {
        const keys = await generateKeys();
        const keyPair = await exportKeys(keys);
        storeKeys(keyPair);
        setKeyPair(keyPair);
      };
      initializeKeys();
    }
  }, [keyPair]);

  const [username, setUsername] = useState(localStorage.getItem(ELocalStorageKey.Username) ?? '');
  const [currentUsername, setCurrentUsername] = useState(username);
  const [peerUsername, setPeerUsername] = useState('');
  const [peer, setPeer] = useState<Peer | null>(null);
  const [playersConnections, setPlayersConnections] = useState<Record<string, DataConnection>>({});
  const [playersPublicKeys, setPlayersPublicKeys] = useState<Record<string, string>>({});
  const isAllPublikKeysGathered = Object.values(playersConnections).every(
    (connection) => !!playersPublicKeys[getUsernameFromPeerId(PAGE_PREFIX, connection.peer)]
  );

  const handleNewConnection = useCallback(
    (connection: DataConnection, publicKey: string) => {
      connection.on('open', async () => {
        setPlayersConnections((prev) =>
          produce(prev, (draft) => {
            draft[connection.peer] = connection;
          })
        );
        await connection.send({
          type: EPeerEventType.publicKey,
          data: {
            publicKey,
          },
        } satisfies IPublicKeyEvent);
      });

      connection.on('close', () => {
        console.debug('connection closed', connection.peer);
        setPlayersConnections((prev) =>
          produce(prev, (draft) => {
            delete draft[connection.peer];
          })
        );
        setPlayersPublicKeys((prev) =>
          produce(prev, (draft) => {
            delete draft[getUsernameFromPeerId(PAGE_PREFIX, connection.peer)];
          })
        );
      });

      connection.on('data', (data: unknown) => {
        if (typeof data !== 'object') return;
        const event = data as TPeerEvent;
        if (event.type === EPeerEventType.initializeGame) {
          const game = event.data;
          navigate(`${routes.game}/${game.id}`);
          const gameBlockchains = JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}');

          const gameBlockchain: IGameBlockChain = {
            initialBoard: game.board,
            players: game.players,
            blocks: [],
          };
          gameBlockchains[game.id] = gameBlockchain;
          localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));
        } else if (event.type === EPeerEventType.publicKey) {
          const { publicKey } = event.data;
          setPlayersPublicKeys((prev) =>
            produce(prev, (draft) => {
              draft[getUsernameFromPeerId(PAGE_PREFIX, connection.peer)] = publicKey;
            })
          );
        } else if (event.type === EPeerEventType.initializeChat) {
          const { id, usernames } = event.data;

          const chats = JSON.parse(localStorage.getItem(ELocalStorageKey.Chats) ?? '{}');
          chats[id] = {
            id,
            usernames,
          };
          localStorage.setItem(ELocalStorageKey.Chats, JSON.stringify(chats));
          navigate(`${routes.chat}/${id}`);
        } else if (event.type === EPeerEventType.initializeVideo) {
          const { id, usernames } = event.data;

          const chats = JSON.parse(localStorage.getItem(ELocalStorageKey.VideoRooms) ?? '{}');
          chats[id] = {
            id,
            usernames,
          };
          localStorage.setItem(ELocalStorageKey.VideoRooms, JSON.stringify(chats));
          navigate(`${routes.video}/${id}`);
        }
      });
    },
    [navigate]
  );

  useEffect(() => {
    if (!publicKey) return;
    const peer = new Peer(getPeerId(PAGE_PREFIX, username), {
      host: import.meta.env.VITE_PEERJS_SERVER_HOST,
      port: Number(import.meta.env.VITE_PEERJS_SERVER_PORT),
      secure: true,
      config: {
        iceServers: [
          { url: 'stun:stun.l.google.com:19302' },
          {
            url: `turn:${import.meta.env.VITE_TURN_SERVER_HOST}:${import.meta.env.VITE_TURN_SERVER_PORT}`,
            username: import.meta.env.VITE_TURN_SERVER_USERNAME,
            credential: import.meta.env.VITE_TURN_SERVER_CREDENTIAL,
          },
        ],
      },
    });
    setPeer(peer);

    peer.on('connection', (connection) => {
      console.debug('connection received', connection.peer);
      handleNewConnection(connection, publicKey);
    });
    peer.on('disconnected', (connectionId) => {
      console.debug('disconnected', connectionId);
      // setPlayersConnections((prev) =>
      //   produce(prev, (draft) => {
      //     delete draft[connectionId];
      //   })
      // );
    });
    peer.on('error', (err) => {
      console.debug(err);
    });

    window.addEventListener('beforeunload', () => {
      peer.destroy();
      setPeer(null);
    });

    return () => {
      peer.destroy();
    };
  }, [username, handleNewConnection, publicKey]);

  const broadcastEvent = (event: TPeerEvent) => {
    for (const connection of Object.values(playersConnections)) {
      connection.send(event);
    }
  };

  return (
    <PageMain>
      <Stack direction="row" justifyContent="center">
        <Card sx={{ padding: 4, flexBasis: 500 }}>
          <Stack direction="column" gap={2}>
            <Typography variant="h1">Peer lobby</Typography>

            {match(username)
              .when(
                (u) => !!u,
                () => (
                  <Stack direction="column" gap={2}>
                    <Typography variant="body1">Юзернейм: {username}</Typography>
                    <Button
                      onClick={() => {
                        localStorage.removeItem(ELocalStorageKey.Username);
                        setUsername('');
                      }}
                    >
                      Сменить юзернейм
                    </Button>
                  </Stack>
                )
              )
              .otherwise(() => {
                const handleSubmit = () => {
                  localStorage.setItem(ELocalStorageKey.Username, currentUsername);
                  setUsername(currentUsername);
                  setCurrentUsername('');
                };
                return (
                  <Stack
                    direction="column"
                    gap={2}
                    component="form"
                    onSubmit={(evt) => {
                      evt.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <Typography variant="body1">Придумайте юзернейм</Typography>
                    <TextField
                      autoCapitalize="off"
                      value={currentUsername}
                      onChange={(e) => setCurrentUsername(e.target.value)}
                    />
                    <Button type="submit">Сохранить</Button>
                  </Stack>
                );
              })}

            {match(peer)
              .with(P.nonNullable, (peer) => {
                const handleSubmit = () => {
                  if (!peerUsername || !publicKey) return;
                  const connection = peer.connect(getPeerId(PAGE_PREFIX, peerUsername), { serialization: 'json' });
                  handleNewConnection(connection, publicKey);
                };
                return (
                  <Stack
                    direction="column"
                    gap={2}
                    component="form"
                    onSubmit={(evt) => {
                      evt.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <Typography variant="body1">Подключиться к игроку</Typography>
                    <TextField value={peerUsername} onChange={(e) => setPeerUsername(e.target.value)} />
                    <Button type="submit" disabled={!peerUsername || !publicKey}>
                      Подключиться
                    </Button>
                  </Stack>
                );
              })
              .otherwise(() => null)}

            <Stack direction="column" gap={2}>
              <Typography variant="body1">Подключенные игроки</Typography>
              {Object.values(playersConnections).map((connection) => (
                <Typography variant="body1" key={connection.peer}>
                  {connection.peer}
                </Typography>
              ))}
            </Stack>

            {Object.values(playersConnections).length > 0 && (
              <Button
                variant="contained"
                disabled={!isAllPublikKeysGathered}
                onClick={async () => {
                  const gameId = uuid();
                  const gameBlockchains = JSON.parse(localStorage.getItem(ELocalStorageKey.GameBlockchains) ?? '{}');

                  const otherPlayerUsernames = Object.values(playersConnections).map((connection) =>
                    getUsernameFromPeerId(PAGE_PREFIX, connection.peer)
                  );
                  const players = [
                    ...otherPlayerUsernames.map((player) => ({
                      username: player,
                      publicKey: playersPublicKeys[player],
                    })),
                    { username, publicKey: publicKey! },
                  ];
                  const playerUsernames = [...otherPlayerUsernames, username];

                  const game: IGame = {
                    id: gameId,
                    players,
                    createdAt: new Date(),
                    board: createBoard(playerUsernames),
                  };

                  broadcastEvent({ type: EPeerEventType.initializeGame, data: game });
                  const gameBlockchain: IGameBlockChain = {
                    initialBoard: game.board,
                    players: game.players,
                    blocks: [],
                  };
                  gameBlockchains[gameId] = gameBlockchain;
                  localStorage.setItem(ELocalStorageKey.GameBlockchains, JSON.stringify(gameBlockchains));
                  navigate(`${routes.game}/${gameId}`);
                }}
              >
                Начать новую игру
              </Button>
            )}

            {Object.values(playersConnections).length > 0 && (
              <>
                <Button
                  variant="contained"
                  onClick={() => {
                    const chatId = uuid();
                    const otherPlayerUsernames = Object.values(playersConnections).map((connection) =>
                      getUsernameFromPeerId(PAGE_PREFIX, connection.peer)
                    );
                    const playerUsernames = [...otherPlayerUsernames, username];
                    const chats = JSON.parse(localStorage.getItem(ELocalStorageKey.Chats) ?? '{}');
                    chats[chatId] = {
                      id: chatId,
                      usernames: playerUsernames,
                    };
                    broadcastEvent({
                      type: EPeerEventType.initializeChat,
                      data: { id: chatId, usernames: playerUsernames },
                    });
                    localStorage.setItem(ELocalStorageKey.Chats, JSON.stringify(chats));
                    navigate(`${routes.chat}/${chatId}`);
                  }}
                >
                  Открыть чат
                </Button>

                <Button
                  variant="contained"
                  onClick={() => {
                    const chatId = uuid();
                    const otherPlayerUsernames = Object.values(playersConnections).map((connection) =>
                      getUsernameFromPeerId(PAGE_PREFIX, connection.peer)
                    );
                    const playerUsernames = [...otherPlayerUsernames, username];
                    const chats = JSON.parse(localStorage.getItem(ELocalStorageKey.VideoRooms) ?? '{}');
                    chats[chatId] = {
                      id: chatId,
                      usernames: playerUsernames,
                    };
                    broadcastEvent({
                      type: EPeerEventType.initializeVideo,
                      data: { id: chatId, usernames: playerUsernames },
                    });
                    localStorage.setItem(ELocalStorageKey.VideoRooms, JSON.stringify(chats));
                    navigate(`${routes.video}/${chatId}`);
                  }}
                >
                  Видеозвонок
                </Button>
              </>
            )}
          </Stack>
        </Card>
      </Stack>
    </PageMain>
  );
};
