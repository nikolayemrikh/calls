import { MediaUnsupportedError } from '../errors';

export const getUserMedia = async (constraints: MediaStreamConstraints): Promise<MediaStream> => {
  if (!navigator.mediaDevices?.getUserMedia) throw new MediaUnsupportedError();

  return navigator.mediaDevices.getUserMedia(constraints);
};
