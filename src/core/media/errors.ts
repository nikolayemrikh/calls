export class MediaUnsupportedError extends Error {
  constructor() {
    super('navigator.mediaDevices.getUserMedia is unavailable');
    this.name = 'MediaUnsupportedError';
  }
}
