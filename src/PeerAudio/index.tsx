import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { getPeerId } from '@app/core/peer/getPeerId';
import { Mic, MicOff } from '@mui/icons-material';
import { Button, Card, IconButton, Stack, Typography } from '@mui/material';
import { captureException } from '@sentry/react';
import copy from 'copy-to-clipboard';
import Peer, { MediaConnection } from 'peerjs';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { v7 as uuid } from 'uuid';

const PAGE_PREFIX = 'peer-audio-chat';

export const PeerAudio: FC = () => {
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
  const audioRef = useRef<HTMLAudioElement>(null);

  const activeConnectionRef = useRef<MediaConnection | null>(null);

  const handleNewConnection = useCallback((connection: MediaConnection) => {
    activeConnectionRef.current = connection;

    connection.on('stream', (stream) => {
      console.debug('media connection stream', connection.peer);
      audioRef.current!.srcObject = stream;
      setIsOtherUserConnected(true);
    });
    connection.on('close', () => {
      activeConnectionRef.current = null;

      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
      console.debug('media connection closed', connection.peer);
      setIsOtherUserConnected(false);
    });
    connection.on('error', (err) => {
      captureException(new Error(`Media connection error: ${err.message}`), { extra: { ...err } });
      activeConnectionRef.current = null;

      if (audioRef.current) {
        audioRef.current.srcObject = null;
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
          iceServers: [
            { url: 'stun:stun.l.google.com:19302' },
            {
              url: `turns:${import.meta.env.VITE_TURN_SERVER_HOST}:${import.meta.env.VITE_TURN_SERVER_PORT}`,
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
        captureException(new Error(`Сonnection error: ${error.message}`), { extra: { ...error } });
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

  useEffect(() => {
    let isCleaned = false;
    let isRunning = false;
    let isDone = false;

    const requestMedia = async () => {
      if (isCleaned || isRunning || isDone) return;
      try {
        isRunning = true;

        let ms: MediaStream;
        try {
          ms = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          });
        } catch {
          return;
        }

        const audioTrack = ms.getAudioTracks()[0];
        if (isCleaned || !audioTrack) {
          ms.getTracks().forEach((track) => track.stop());
          return;
        }

        isDone = true;
        window.clearInterval(interval);

        await applyTrack(audioTrack);

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
  }, [applyTrack, localStream]);

  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(false);

  useEffect(() => {
    if (!mediaStream) return;

    for (const track of mediaStream.getAudioTracks()) {
      track.enabled = isMicrophoneEnabled;
    }
  }, [mediaStream, isMicrophoneEnabled]);

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

  return (
    <Stack direction="column" flexGrow={1} gap={2} height="100%" position="relative">
      <audio ref={audioRef} autoPlay playsInline />

      {isOtherUserConnected ? (
        <Stack direction="column" flexGrow={1} gap={4} alignItems="center" justifyContent="center" padding={2}>
          <Typography variant="h5" textAlign="center">
            Аудиозвонок идёт
          </Typography>
        </Stack>
      ) : (
        <Stack direction="column" flexGrow={1} gap={4} alignItems="center" justifyContent="center" padding={2}>
          {currentUsername === hostUsername ? (
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
          ) : (
            <Typography variant="body1" textAlign="center">
              Подключение...
            </Typography>
          )}
        </Stack>
      )}

      <Stack direction="column" alignItems="center" gap={1} paddingBottom={4}>
        <IconButton
          disabled={!mediaStream}
          color={isMicrophoneEnabled ? 'primary' : 'default'}
          onClick={() => {
            setIsMicrophoneEnabled((c) => !c);
          }}
          sx={{ width: 64, height: 64, border: 1, borderColor: 'divider' }}
        >
          {isMicrophoneEnabled ? <Mic /> : <MicOff />}
        </IconButton>
        <Typography variant="body2" textAlign="center">
          {isMicrophoneEnabled ? 'Микрофон включён' : 'Микрофон выключен'}
        </Typography>
      </Stack>
    </Stack>
  );
};
