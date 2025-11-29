import { EThemeModeSetting } from '@app/core/theme/ThemeModeSettingContext/types';

const isThemeModeSetting = (value: string): value is EThemeModeSetting => {
  return (Object.values(EThemeModeSetting) as string[]).includes(value);
};

/** Retrieve stored theme mode from local storage by the key */
export const retrieveStoredThemeModeSettingFromLocalStorage = (key: string): (() => EThemeModeSetting | null) => {
  if (!key) throw new Error('key should be non-empty string');

  return (): EThemeModeSetting | null => {
    let themeSetting: string | null = null;
    try {
      themeSetting = window.localStorage.getItem(key);
    } catch {
      //
    }
    if (themeSetting && isThemeModeSetting(themeSetting)) {
      return themeSetting;
    }
    return themeSetting && isThemeModeSetting(themeSetting) ? themeSetting : null;
  };
};
