import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'https://91ba10c0ecaba65b10cbc5d27bea1da6@o4507922532794368.ingest.de.sentry.io/4510464101056592',
  sendDefaultPii: true,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1,
  debug: true,
});
