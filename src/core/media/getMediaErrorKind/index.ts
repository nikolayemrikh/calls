import { EMediaErrorKind } from '../enums';
import { MediaUnsupportedError } from '../errors';

export const getMediaErrorKind = (error: unknown): EMediaErrorKind => {
  if (error instanceof MediaUnsupportedError) return EMediaErrorKind.unsupported;

  const name = error instanceof Error ? error.name : '';

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return EMediaErrorKind.notAllowed;
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return EMediaErrorKind.notFound;
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return EMediaErrorKind.overconstrained;
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return EMediaErrorKind.notReadable;
    default:
      return EMediaErrorKind.unknown;
  }
};

export const isMediaErrorFatal = (kind: EMediaErrorKind): boolean =>
  kind !== EMediaErrorKind.notReadable && kind !== EMediaErrorKind.unknown;
