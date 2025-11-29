import { EThemeModeSetting } from '@app/core/theme/ThemeModeSettingContext/types';
/** Put theme mode setting in local storage under specified */
export const putThemeModeSettingInLocalStorage = (key: string): ((themeModeSetting: EThemeModeSetting) => void) => {
  if (!key) throw new Error('key should be non-empty string');

  return (themeModeSetting: EThemeModeSetting): void => {
    try {
      window.localStorage.setItem(key, themeModeSetting);
    } catch {
      //
    }
  };
};
