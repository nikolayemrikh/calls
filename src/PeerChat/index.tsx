import { PageMain } from '@app/components/PageMain';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import SendIcon from '@mui/icons-material/Send';
import { Button, Stack, TextField, Typography } from '@mui/material';
import { produce } from 'immer';
import Peer, { DataConnection } from 'peerjs';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

const PAGE_PREFIX = 'peer-chat';

enum EPeerChatEvent {
  message = 'message',
}

interface IPeerChatMessage {
  id: string;
  createdAt: string;
  text: string;
  username: string;
}

export interface IPeerChatMessageEvent {
  type: EPeerChatEvent.message;
  data: IPeerChatMessage;
}

export type TPeerChatEvent = IPeerChatMessageEvent;

const getStoredChats = (): Record<string, { usernames: string[] }> => {
  return JSON.parse(localStorage.getItem(ELocalStorageKey.Chats) ?? '{}');
};

export const PeerChat: FC = () => {
  const { id } = useParams();

  if (!id) throw new Error('id is required');

  const chats = useMemo(() => getStoredChats(), []);
  const usernames = useMemo(() => chats[id].usernames ?? [], [chats, id]);
  const username = localStorage.getItem(ELocalStorageKey.Username);
  if (!username) throw new Error('username is required');
  const [peer, setPeer] = useState<Peer | null>(null);

  const [playersConnections, setPlayersConnections] = useState<Record<string, DataConnection>>({});
  const [messages, setMessages] = useState<IPeerChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const isAllPlayersConnected = Object.keys(playersConnections).length === usernames.length - 1;

  const scrollableRootRef = useRef<HTMLDivElement>(null);
  const scrollToTheBottom = useCallback(() => {
    const scrollableRoot = scrollableRootRef.current;
    if (scrollableRoot) {
      scrollableRoot.scrollTop = scrollableRoot.scrollHeight;
    }
  }, []);

  const handleNewConnection = useCallback((connection: DataConnection) => {
    connection.on('open', async () => {
      console.debug('connection opened', connection.peer);

      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          draft[connection.peer] = connection;
        })
      );
    });
    connection.on('close', () => {
      console.debug('connection closed', connection.peer);
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          delete draft[connection.peer];
        })
      );
    });

    const handleData = async (data: unknown) => {
      console.debug('data received', data);

      if (typeof data !== 'object') return;
      const event = data as TPeerChatEvent;
      if (event.type === EPeerChatEvent.message) {
        const message = event.data;
        setMessages((prev) => [...prev, message]);
      }
    };

    connection.on('data', handleData);
  }, []);

  useEffect(() => {
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
    peer.on('open', () => {
      setPeer(peer);
    });

    peer.on('connection', async (connection) => {
      console.debug('connection received', connection.peer);

      handleNewConnection(connection);
    });
    peer.on('disconnected', (connectionId) => {
      console.debug('disconnected', connectionId);
      // setPlayersConnections((prev) =>
      //   produce(prev, (draft) => {
      //     delete draft[connectionId];
      //   })
      // );
      // setPlayersLastBlockHashes((prev) =>
      //   produce(prev, (draft) => {
      //     delete draft[connectionId];
      //   })
      // );
      // setIsAllPlayersSynced(false);
    });

    window.addEventListener('beforeunload', () => {
      peer.destroy();
      setPeer(null);
    });

    return () => {
      peer.destroy();
      setPeer(null);
    };
  }, [username, handleNewConnection]);

  useEffect(() => {
    if (!peer) return;

    setPlayersConnections((prev) =>
      produce(prev, (draft) => {
        for (const player of usernames) {
          const connectionId = getPeerId(PAGE_PREFIX, player);
          if (player === username) continue;
          if (draft[connectionId]) continue;
          const connection: DataConnection | undefined = peer.connect(connectionId, { serialization: 'json' });
          // could be undefined if peer is destroyed
          if (!connection) return;
          draft[connectionId] = connection;
          console.debug('connection created', connection.peer);
          handleNewConnection(connection);
        }
      })
    );

    return () => {
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          for (const connection of Object.values(draft)) {
            connection.close();
            delete draft[connection.peer];
          }
        })
      );
    };
  }, [peer, username, usernames, handleNewConnection]);

  const broadcastEvent = async (event: TPeerChatEvent) => {
    await Promise.all(Object.values(playersConnections).map((connection) => connection.send(event)));
  };

  const submitMessage = () => {
    const newMessage = { id: uuid(), createdAt: new Date().toISOString(), text: message, username };
    broadcastEvent({
      type: EPeerChatEvent.message,
      data: newMessage,
    });
    setMessages((prev) =>
      produce(prev, (draft) => {
        draft.push(newMessage);
      })
    );
    setMessage('');
  };

  useEffect(() => {
    if (messages.length === 0) return;
    scrollToTheBottom();
  }, [messages, scrollToTheBottom]);

  return (
    <PageMain>
      {isAllPlayersConnected ? (
        <Stack direction="column" flexGrow={1} gap={2} height="100%">
          <Stack direction="column" gap={1} flexGrow={1} overflow="auto" ref={scrollableRootRef}>
            <Stack direction="column" gap={1}>
              {messages.map((message, idx) => (
                <Stack
                  key={message.id}
                  direction="row"
                  gap={1}
                  justifyContent="space-between"
                  bgcolor={(t) => (idx % 2 === 0 ? t.palette.info.dark : 'transparent')}
                  padding={2}
                  borderRadius={2}
                >
                  <Stack direction="column" gap={0.5}>
                    <Typography variant="body2">{message.username}</Typography>
                    <Typography variant="body1">{message.text}</Typography>
                  </Stack>
                  <Typography variant="body2">
                    {new Date(message.createdAt).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
          <Stack direction="row" gap={2}>
            <TextField
              fullWidth
              multiline
              minRows={1}
              maxRows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submitMessage();
                }
              }}
            />
            <Button variant="contained" endIcon={<SendIcon />} onClick={submitMessage}>
              Send
            </Button>
          </Stack>
        </Stack>
      ) : (
        <div>Waiting for other players...</div>
      )}
    </PageMain>
  );
};
