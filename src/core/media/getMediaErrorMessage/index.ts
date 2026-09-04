import { EMediaErrorKind, EMediaKind } from '../enums';
import { isInAppBrowser } from '../isInAppBrowser';

type TDeviceLabels = {
  dative: string;
  notFound: string;
  busy: string;
};

const DEVICE_LABELS: Record<EMediaKind, TDeviceLabels> = {
  [EMediaKind.videoAndAudio]: {
    dative: 'камере и микрофону',
    notFound: 'Камера или микрофон не найдены',
    busy: 'Камера или микрофон заняты',
  },
  [EMediaKind.audio]: {
    dative: 'микрофону',
    notFound: 'Микрофон не найден',
    busy: 'Микрофон занят',
  },
};

const IN_APP_BROWSER_HINT =
  'Похоже, страница открыта во встроенном браузере приложения — он обычно не пропускает доступ к устройствам. Откройте ссылку в Chrome или Safari.';

export type TMediaErrorMessage = {
  title: string;
  description: string;
  isRetriable: boolean;
};

export const getMediaErrorMessage = (kind: EMediaErrorKind, mediaKind: EMediaKind): TMediaErrorMessage => {
  const labels = DEVICE_LABELS[mediaKind];

  switch (kind) {
    case EMediaErrorKind.unsupported:
      return {
        title: `Браузер не даёт доступ к ${labels.dative}`,
        description: isInAppBrowser()
          ? IN_APP_BROWSER_HINT
          : 'Страница должна быть открыта по HTTPS в современном браузере.',
        isRetriable: false,
      };
    case EMediaErrorKind.notAllowed:
      return {
        title: `Нет доступа к ${labels.dative}`,
        description: isInAppBrowser()
          ? IN_APP_BROWSER_HINT
          : 'Разрешите доступ в настройках браузера и повторите попытку.',
        isRetriable: true,
      };
    case EMediaErrorKind.notFound:
      return {
        title: labels.notFound,
        description: 'Подключите устройство и повторите попытку.',
        isRetriable: true,
      };
    case EMediaErrorKind.overconstrained:
      return {
        title: 'Устройство не поддерживает требуемые параметры',
        description: 'Попробуйте другую камеру или другой браузер.',
        isRetriable: true,
      };
    case EMediaErrorKind.notReadable:
      return {
        title: `${labels.busy} другим приложением`,
        description: 'Закройте приложения, которые их используют — подключение продолжится само.',
        isRetriable: false,
      };
    case EMediaErrorKind.unknown:
      return {
        title: `Не удалось получить доступ к ${labels.dative}`,
        description: 'Попытки продолжаются автоматически.',
        isRetriable: false,
      };
  }
};
