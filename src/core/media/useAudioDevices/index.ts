import { useEffect, useState } from 'react';

type TAudioDevices = {
  inputs: MediaDeviceInfo[];
  outputs: MediaDeviceInfo[];
};

export const useAudioDevices = (isEnabled: boolean): TAudioDevices => {
  const [devices, setDevices] = useState<TAudioDevices>({ inputs: [], outputs: [] });

  useEffect(() => {
    if (!isEnabled) return;
    if (!navigator.mediaDevices?.enumerateDevices) return;

    const mediaDevices = navigator.mediaDevices;
    let isCleaned = false;

    const refresh = async () => {
      let allDevices: MediaDeviceInfo[];
      try {
        allDevices = await mediaDevices.enumerateDevices();
      } catch {
        return;
      }

      if (isCleaned) return;

      setDevices({
        inputs: allDevices.filter((device) => device.kind === 'audioinput'),
        outputs: allDevices.filter((device) => device.kind === 'audiooutput'),
      });
    };

    refresh();
    mediaDevices.addEventListener('devicechange', refresh);

    return () => {
      isCleaned = true;
      mediaDevices.removeEventListener('devicechange', refresh);
    };
  }, [isEnabled]);

  return devices;
};
