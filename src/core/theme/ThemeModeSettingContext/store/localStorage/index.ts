import { putThemeModeSettingInLocalStorage } from './helpers/putThemeModeSettingInLocalStorage/putThemeModeSettingInLocalStorage';
import { retrieveStoredThemeModeSettingFromLocalStorage } from './helpers/retrieveStoredThemeModeSettingFromLocalStorage/retrieveStoredThemeModeSettingFromLocalStorage';
import { ICreateLocalStorageThemeSettingStoreReturn } from './types.ts';

export const createLocalStorageThemeSettingStore = (key: string): ICreateLocalStorageThemeSettingStoreReturn => ({
  retrieve: retrieveStoredThemeModeSettingFromLocalStorage(key),
  put: putThemeModeSettingInLocalStorage(key),
});
