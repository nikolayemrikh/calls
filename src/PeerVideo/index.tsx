import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Stack } from '@mui/material';
import { produce } from 'immer';
import Peer, { MediaConnection } from 'peerjs';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

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
  return JSON.parse(localStorage.getItem(ELocalStorageKey.VideoRooms) ?? '{}');
};

export const PeerVideo: FC = () => {
  const { id } = useParams();

  if (!id) throw new Error('id is required');

  const chats = useMemo(() => getStoredChats(), []);
  const usernames = useMemo(() => chats[id].usernames ?? [], [chats, id]);
  const username = localStorage.getItem(ELocalStorageKey.Username);
  if (!username) throw new Error('username is required');
  const [peer, setPeer] = useState<Peer | null>(null);

  const [, setPlayersConnections] = useState<Record<string, MediaConnection>>({});
  // const [messages, setMessages] = useState<IPeerChatMessage[]>([]);
  // const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  // const isAllPlayersConnected = Object.keys(playersConnections).length === usernames.length - 1;

  const scrollableRootRef = useRef<HTMLDivElement>(null);
  // const scrollToTheBottom = useCallback(() => {
  //   const scrollableRoot = scrollableRootRef.current;
  //   if (scrollableRoot) {
  //     scrollableRoot.scrollTop = scrollableRoot.scrollHeight;
  //   }
  // }, []);

  const handleNewConnection = useCallback((connection: MediaConnection) => {
    connection.on('stream', (stream) => {
      videoRef.current!.srcObject = stream;
      // try {
      //   videoRef.current.play();
      // } catch {
      //   //
      // }

      console.debug('connection opened', connection.peer);

      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          draft[connection.peer] = connection;
        })
      );
    });
    connection.on('close', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('connection closed', connection.peer);
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          delete draft[connection.peer];
        })
      );
    });
    connection.on('error', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('connection error', connection.peer);
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          delete draft[connection.peer];
        })
      );
    });

    // const handleData = async (data: unknown) => {
    //   console.debug('data received', data);

    //   if (typeof data !== 'object') return;
    //   const event = data as TPeerChatEvent;
    //   if (event.type === EPeerChatEvent.message) {
    //     const message = event.data;
    //     setMessages((prev) => [...prev, message]);
    //   }
    // };

    // connection.on('data', handleData);
  }, []);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!mediaStream) return;
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

    peer.on('call', (connection) => {
      console.debug('connection received', connection.peer);
      connection.answer(mediaStream);
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
  }, [username, mediaStream, handleNewConnection]);

  useEffect(() => {
    (async () => {
      const ms = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 1280, ideal: 1920, max: 2560 },
          height: { min: 720, ideal: 1080, max: 1440 },
          frameRate: { ideal: 60 }, // высокая частота кадров
          facingMode: 'user', // или "environment" для задней камеры
          // aspectRatio: { ideal: 16 / 9 },
          // advanced: [{ exposureMode: 'manual' }, { focusMode: 'continuous' }, { whiteBalanceMode: 'continuous' }],
        },
        audio: true,
      });
      setMediaStream(ms);
    })();
  }, []);

  useEffect(() => {
    if (!peer || !mediaStream) return;

    const timer = window.setTimeout(() => {
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          for (const player of usernames) {
            const connectionId = getPeerId(PAGE_PREFIX, player);
            if (player === username) continue;
            if (draft[connectionId]) continue;
            // const connection: DataConnection | undefined = peer.connect(connectionId, { serialization: 'json' });
            const connection: MediaConnection | undefined = peer.call(connectionId, mediaStream); // could be undefined if peer is destroyed
            if (!connection) throw new Error('no connection created');
            draft[connectionId] = connection;
            console.debug('connection created', connection.peer);
            handleNewConnection(connection);
          }
        })
      );
    }, Math.random() * 1200);

    return () => {
      window.clearTimeout(timer);
      setPlayersConnections((prev) =>
        produce(prev, (draft) => {
          for (const connection of Object.values(draft)) {
            connection.close();
            delete draft[connection.peer];
          }
        })
      );
    };
  }, [peer, mediaStream, username, usernames, handleNewConnection]);

  return (
    <Stack direction="column" flexGrow={1} gap={2} height="100%">
      <Stack direction="column" gap={1} flexGrow={1} overflow="auto" ref={scrollableRootRef}>
        <Stack direction="column" gap={1}>
          <video ref={videoRef} style={{ flexGrow: 1, width: '100%' }} autoPlay playsInline />
        </Stack>
      </Stack>
    </Stack>
  );
};
