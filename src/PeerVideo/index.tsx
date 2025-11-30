import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Stack } from '@mui/material';
import Peer, { MediaConnection } from 'peerjs';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

const PAGE_PREFIX = 'peer-chat';

export const PeerVideo: FC = () => {
  const { username: otherUsername } = useParams();
  if (!otherUsername) throw new Error('otherUsername is required');

  const username = localStorage.getItem(ELocalStorageKey.Username);
  if (!username) throw new Error('username is required');

  const [peer, setPeer] = useState<Peer | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollableRootRef = useRef<HTMLDivElement>(null);
  const handleNewConnection = useCallback((connection: MediaConnection) => {
    connection.on('stream', (stream) => {
      console.debug('connection stream', connection.peer);
      videoRef.current!.srcObject = stream;
    });
    connection.on('close', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('connection closed', connection.peer);
    });
    connection.on('error', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('connection error', connection.peer);
    });
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
      const connectionId = getPeerId(PAGE_PREFIX, otherUsername);
      const connection: MediaConnection | undefined = peer.call(connectionId, mediaStream); // could be undefined if peer is destroyed
      if (!connection) throw new Error('no connection created');
      console.debug('connection created', connection.peer);
      handleNewConnection(connection);
    }, Math.random() * 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [peer, mediaStream, otherUsername, handleNewConnection]);

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
