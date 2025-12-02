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
  const { username: hostUsername } = useParams();
  if (!hostUsername) throw new Error('hostUsername is required');

  const currentUsername = useMemo(() => {
    const storedUsername = localStorage.getItem(ELocalStorageKey.Username);
    if (storedUsername) return storedUsername;
    const randomUsername = uuid();
    localStorage.setItem(ELocalStorageKey.Username, randomUsername);
    return randomUsername;
  }, []);

  const [peer, setPeer] = useState<Peer | null>(null);

  const [isOtherUserConnected, setIsOtherUserConnected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopbackVideoRef = useRef<HTMLVideoElement>(null);
  const handleNewConnection = useCallback((connection: MediaConnection) => {
    connection.on('stream', (stream) => {
      console.debug('media connection stream', connection.peer);
      videoRef.current!.srcObject = stream;
      setIsOtherUserConnected(true);
    });
    connection.on('close', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('media connection closed', connection.peer);
      setIsOtherUserConnected(false);
    });
    connection.on('error', () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('media connection error', connection.peer);
      setIsOtherUserConnected(false);
    });
  }, []);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  useEffect(() => {
    if (!loopbackVideoRef.current) throw new Error('loopbackVideoRef.current should be defined');
    loopbackVideoRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    if (!mediaStream) return;

    let recreateInterval: number | null = null;
    const startRecreate = () => {
      if (recreateInterval) return;
      recreateInterval = window.setInterval(() => {
        if (currentPeer) return;
        console.debug('Trying to recreate peer');
        currentPeer = createPeer();
      }, 1000);
    };
    const stopRecreate = () => {
      if (!recreateInterval) return;
      clearInterval(recreateInterval);
      recreateInterval = null;
    };

    let currentPeer: Peer | null = null;

    const failPeer = (peer: Peer) => {
      setPeer(null);
      try {
        peer.destroy();
      } catch {
        //
      }

      currentPeer = null;
      startRecreate();
    };

    const createPeer = () => {
      const peer = new Peer(getPeerId(PAGE_PREFIX, currentUsername), {
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
        console.debug('peer opened', peer.id);
        setPeer(peer);
        stopRecreate();
      });

      peer.on('call', (connection) => {
        console.debug('connection received', connection.peer);
        connection.answer(mediaStream);
        handleNewConnection(connection);
      });

      peer.on('error', (error) => {
        console.debug('error', error);
        failPeer(peer);
      });

      peer.on('disconnected', (connectionId) => {
        console.debug('disconnected', connectionId);
        failPeer(peer);
      });

      peer.on('close', () => {
        console.debug('closed');
        failPeer(peer);
      });

      window.addEventListener('beforeunload', () => {
        peer.destroy();
        setPeer(null);
      });

      return peer;
    };

    currentPeer = createPeer();

    return () => {
      stopRecreate();
      try {
        currentPeer?.destroy();
      } catch {
        //
      }
      currentPeer = null;
      setPeer(null);
    };
  }, [currentUsername, mediaStream, handleNewConnection]);

  useEffect(() => {
    let isCleaned = false;
    let isRequestMediaRunning = false;

    const requestMedia = async () => {
      if (isRequestMediaRunning) return;
      isRequestMediaRunning = true;
      let ms: MediaStream | undefined;
      try {
        ms = await navigator.mediaDevices.getUserMedia({
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
      } catch {
        isRequestMediaRunning = false;
        return;
      }
      isRequestMediaRunning = false;
      if (isCleaned || !ms) return;
      setMediaStream(ms);
      window.clearInterval(interval);
    };

    requestMedia();

    const interval = window.setInterval(requestMedia, 1000);

    return () => {
      isCleaned = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!peer || !mediaStream) return;
    if (currentUsername === hostUsername) return;
    if (isOtherUserConnected) return;

    const connectionId = getPeerId(PAGE_PREFIX, hostUsername);

    const callHost = () => {
      if (!peer.open) return;
      const connection: MediaConnection | undefined = peer.call(connectionId, mediaStream); // could be undefined if peer is destroyed
      if (!connection) return;

      window.clearInterval(interval);
      handleNewConnection(connection);
      console.debug('connection created', connection.peer);
    };

    const interval = window.setInterval(callHost, 1000);
    callHost();

    return () => {
      window.clearInterval(interval);
    };
  }, [peer, mediaStream, hostUsername, currentUsername, handleNewConnection, isOtherUserConnected]);

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
          style={{ width: 100, height: 100, position: 'absolute', bottom: 10, left: 10, transform: 'scaleX(-1)' }}
        />
      </Stack>

      {!isOtherUserConnected && currentUsername === hostUsername && (
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
