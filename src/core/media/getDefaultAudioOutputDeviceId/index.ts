export const getDefaultAudioOutputDeviceId = (outputs: MediaDeviceInfo[]): string | null => {
  const defaultDevice = outputs.find((device) => device.deviceId === 'default') ?? outputs[0];

  return defaultDevice?.deviceId ?? null;
};
