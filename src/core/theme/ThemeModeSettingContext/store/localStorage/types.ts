import { EThemeModeSetting } from '../../types';

export interface ICreateLocalStorageThemeSettingStoreReturn {
  retrieve: () => EThemeModeSetting | null;
  put: (themeModeSetting: EThemeModeSetting) => void;
}
