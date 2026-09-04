import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { EMediaErrorKind, EMediaKind } from '@app/core/media/enums';
import { getMediaErrorKind, isMediaErrorFatal } from '@app/core/media/getMediaErrorKind';
import { getMediaErrorMessage } from '@app/core/media/getMediaErrorMessage';
import { getUserMedia } from '@app/core/media/getUserMedia';
import { playMediaElement } from '@app/core/media/playMediaElement';
import { getIceServers } from '@app/core/peer/getIceServers';
import { getPeerId } from '@app/core/peer/getPeerId';
import { FlipCameraIos } from '@mui/icons-material';
import { Button, Card, IconButton, Stack, Typography } from '@mui/material';
import { captureException } from '@sentry/react';
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

  const activeConnectionRef = useRef<MediaConnection | null>(null);

  const handleNewConnection = useCallback((connection: MediaConnection) => {
    activeConnectionRef.current = connection;

    connection.on('stream', async (stream) => {
      console.debug('media connection stream', connection.peer);
      const video = videoRef.current!;
      video.srcObject = stream;
      setIsOtherUserConnected(true);
      setIsPlaybackBlocked(!(await playMediaElement(video)));
    });
    connection.on('close', () => {
      activeConnectionRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('media connection closed', connection.peer);
      setIsOtherUserConnected(false);
    });
    connection.on('error', (err) => {
      captureException(new Error(`Media connection error: ${err.message}`), {
        extra: { ...err },
      });
      activeConnectionRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      console.debug('media connection error', connection.peer);
      setIsOtherUserConnected(false);
    });
  }, []);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const localStream = useMemo(() => new MediaStream(), []);

  const applyTrack = useCallback(
    async (track: MediaStreamTrack) => {
      const { kind } = track;

      const connection = activeConnectionRef.current;
      if (connection) {
        const sender = connection.peerConnection.getSenders()?.find((s: RTCRtpSender) => s.track?.kind === kind);
        if (sender) {
          console.debug(`Replacing ${kind} track...`);
          await sender.replaceTrack(track);
        }
      }

      for (const previousTrack of localStream.getTracks()) {
        if (previousTrack.kind !== kind || previousTrack === track) continue;
        localStream.removeTrack(previousTrack);
        previousTrack.stop();
      }
      localStream.addTrack(track);
    },
    [localStream]
  );

  useEffect(
    () => () => {
      localStream.getTracks().forEach((track) => track.stop());
    },
    [localStream]
  );

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
    let isCleaned = false;

    const failPeer = (peer: Peer) => {
      if (isCleaned) return;
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
          iceServers: getIceServers(),
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
        captureException(new Error(`Сonnection error: ${error.message}`), {
          extra: { ...error },
        });
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
      isCleaned = true;
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

  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false);
  const [mediaErrorKind, setMediaErrorKind] = useState<EMediaErrorKind | null>(null);
  const [isMediaRequestPaused, setIsMediaRequestPaused] = useState(false);

  const [facingMode, setFacingMode] = useState('user');

  useEffect(() => {
    if (isMediaRequestPaused) return;

    let isCleaned = false;
    let isRunning = false;
    let isDone = false;

    const requestMedia = async () => {
      if (isCleaned || isRunning || isDone) return;
      try {
        isRunning = true;

        const isAudioNeeded = localStream.getAudioTracks().length === 0;

        let ms: MediaStream;
        try {
          // Только ideal: min/max — это жёсткие требования, и камера, которая их не тянет
          // (фронталка бюджетного телефона, урезанный WebView), отвечает OverconstrainedError.
          ms = await getUserMedia({
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 },
              facingMode: facingMode,
            },
            audio: isAudioNeeded,
          });
        } catch (error) {
          const kind = getMediaErrorKind(error);
          setMediaErrorKind(kind);

          if (!isMediaErrorFatal(kind)) return;

          isDone = true;
          setIsMediaRequestPaused(true);
          captureException(new Error(`getUserMedia failed: ${kind}`), {
            extra: { kind, userAgent: navigator.userAgent },
          });
          return;
        }

        const videoTrack = ms.getVideoTracks()[0];
        if (isCleaned || !videoTrack) {
          ms.getTracks().forEach((track) => track.stop());
          return;
        }

        isDone = true;
        window.clearInterval(interval);
        setMediaErrorKind(null);

        const audioTrack = ms.getAudioTracks()[0];
        if (audioTrack) await applyTrack(audioTrack);
        await applyTrack(videoTrack);

        if (loopbackVideoRef.current) {
          loopbackVideoRef.current.srcObject = new MediaStream([videoTrack]);
        }

        setMediaStream(localStream);
      } finally {
        isRunning = false;
      }
    };

    requestMedia();

    const interval = window.setInterval(requestMedia, 1000);

    return () => {
      isCleaned = true;
      window.clearInterval(interval);
    };
  }, [facingMode, applyTrack, localStream, isMediaRequestPaused]);

  useEffect(() => {
    if (!peer || !mediaStream) return;
    if (currentUsername === hostUsername) return;
    if (isOtherUserConnected) return;

    const connectionId = getPeerId(PAGE_PREFIX, hostUsername);

    const callHost = () => {
      if (!peer.open) return;
      const connection: MediaConnection | undefined = peer.call(connectionId, mediaStream);
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

  const mediaErrorMessage = mediaErrorKind ? getMediaErrorMessage(mediaErrorKind, EMediaKind.videoAndAudio) : null;

  return (
    <Stack direction="column" flexGrow={1} gap={2} height="100%" position="relative">
      <Stack direction="column" width="100%" height="100%" ref={containerRef} position="absolute" zIndex={1}>
        <video ref={videoRef} autoPlay playsInline style={{ width, height }} />
        <video
          ref={loopbackVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: 100,
            height: 100,
            position: 'absolute',
            bottom: 10,
            left: 10,
            transform: facingMode === 'user' ? 'scaleX(-1)' : undefined,
          }}
        />
        <IconButton
          onClick={() => {
            setFacingMode((c) => (c === 'user' ? 'environment' : 'user'));
          }}
          sx={{ position: 'absolute', bottom: 10, right: 10 }}
        >
          <FlipCameraIos />
        </IconButton>
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

      {mediaErrorMessage && (
        <Stack
          direction="column"
          flexGrow={1}
          gap={4}
          alignItems="center"
          justifyContent="center"
          zIndex={3}
          padding={2}
        >
          <Stack direction="row" justifyContent="center" width="100%">
            <Card sx={{ padding: 4, flexBasis: 500 }}>
              <Stack direction="column" gap={2}>
                <Typography variant="h6" textAlign="center">
                  {mediaErrorMessage.title}
                </Typography>
                <Typography variant="body2" textAlign="center">
                  {mediaErrorMessage.description}
                </Typography>
                {mediaErrorMessage.isRetriable && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      setMediaErrorKind(null);
                      setIsMediaRequestPaused(false);
                    }}
                  >
                    Повторить
                  </Button>
                )}
              </Stack>
            </Card>
          </Stack>
        </Stack>
      )}

      {isPlaybackBlocked && (
        <Stack
          direction="row"
          justifyContent="center"
          zIndex={3}
          padding={2}
          position="absolute"
          bottom={80}
          left={0}
          right={0}
        >
          <Button
            variant="contained"
            size="large"
            onClick={async () => {
              const video = videoRef.current;
              if (!video) return;
              setIsPlaybackBlocked(!(await playMediaElement(video)));
            }}
          >
            Нажмите, чтобы включить звук
          </Button>
        </Stack>
      )}
    </Stack>
  );
};
