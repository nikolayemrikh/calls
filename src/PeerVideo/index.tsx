import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Button, Card, Stack, Typography } from '@mui/material';
import copy from 'copy-to-clipboard';
import Peer, { MediaConnection } from 'peerjs';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v7 as uuid } from 'uuid';

const PAGE_PREFIX = 'peer-chat';

export const PeerVideo: FC = () => {
  const { username: otherUsername } = useParams();
  if (!otherUsername) throw new Error('otherUsername is required');

  const username = useMemo(() => {
    const storedUsername = localStorage.getItem(ELocalStorageKey.Username);
    if (storedUsername) return storedUsername;
    const randomUsername = uuid();
    localStorage.setItem(ELocalStorageKey.Username, randomUsername);
    return randomUsername;
  }, []);
  if (!username) throw new Error('username is required');

  const [peer, setPeer] = useState<Peer | null>(null);

  const [isOtherUserConnected, setIsOtherUserConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopbackVideoRef = useRef<HTMLVideoElement>(null);
  const handleNewConnection = useCallback((connection: MediaConnection) => {
    connection.on('stream', (stream) => {
      console.debug('connection stream', connection.peer);
      videoRef.current!.srcObject = stream;
      setIsOtherUserConnected(true);
    });
    connection.on('close', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('connection closed', connection.peer);
      setIsOtherUserConnected(false);
    });
    connection.on('error', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('connection error', connection.peer);
      setIsOtherUserConnected(false);
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
      if (loopbackVideoRef.current) {
        loopbackVideoRef.current.srcObject = ms;
      }
      setMediaStream(ms);
    })();
  }, []);

  useEffect(() => {
    if (!peer || !mediaStream) return;
    if (username === otherUsername) return;

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
  }, [peer, mediaStream, otherUsername, username, handleNewConnection]);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  const changeSize = useCallback((container: HTMLDivElement) => {
    const { width: containerWidth, height: containerHeight } = container.getBoundingClientRect();

    let width: number;
    let height: number;

    width = containerWidth;
    height = containerHeight;

    setWidth(width);
    setHeight(height);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    changeSize(container);

    const observer = new ResizeObserver(() => {
      changeSize(container);
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [changeSize]);

  return (
    <Stack direction="column" flexGrow={1} gap={2} height="100%" position="relative">
      <Stack direction="column" width="100%" height="100%" ref={containerRef} position="absolute" zIndex={1}>
        <video ref={videoRef} autoPlay playsInline style={{ width, height }} />
        <video
          ref={loopbackVideoRef}
          autoPlay
          playsInline
          muted
          style={{ width: 100, height: 100, position: 'absolute', bottom: 10, left: 10 }}
        />
      </Stack>

      {!isOtherUserConnected && username === otherUsername && (
        <Stack
          direction="column"
          flexGrow={1}
          gap={4}
          alignItems="center"
          justifyContent="center"
          zIndex={2}
          padding={2}
        >
          <Stack direction="row" justifyContent="center" width="100%">
            <Card sx={{ padding: 4, flexBasis: 500 }}>
              <Stack direction="column" gap={2}>
                <Typography variant="body2" textAlign="center" textOverflow="ellipsis">
                  {window.location.href}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    copy(window.location.href);
                  }}
                >
                  Скопировать ссылку
                </Button>
                <Typography variant="body2" textAlign="center">
                  Нажмите скопировать ссылку и поделитесь ею с собеседником
                </Typography>
                <Typography variant="body2" textAlign="center">
                  Затем дождитесь его подключения здесь
                </Typography>
              </Stack>
            </Card>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
};
