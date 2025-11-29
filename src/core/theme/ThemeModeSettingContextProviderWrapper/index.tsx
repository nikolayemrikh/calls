import { ELocalStorageKey } from '@app/core/localStorage/constants';
import { ReactElement, useState } from 'react';
import { ThemeModeSettingContextProvider } from '../ThemeModeSettingContext/ThemeModeSettingContextProvider/ThemeModeSettingContext';
import { createLocalStorageThemeSettingStore } from '../ThemeModeSettingContext/store/localStorage';
import { EThemeModeSetting } from '../ThemeModeSettingContext/types';
import { IThemeModeSettingContextProviderWrapperProps } from './types';

const localStorageThemeSettingStore = createLocalStorageThemeSettingStore(ELocalStorageKey.ThemeModeSetting);

const defaultThemeSetting = EThemeModeSetting.Light;

export const ThemeModeSettingContextProviderWrapper = (
  props: IThemeModeSettingContextProviderWrapperProps
): ReactElement => {
  const { children } = props;
  const [themeModeSetting, setThemeMode] = useState(
    () => localStorageThemeSettingStore.retrieve() ?? defaultThemeSetting
  );

  return (
    <ThemeModeSettingContextProvider
      modeSetting={themeModeSetting}
      onModeSettingChange={(modeSetting) => {
        localStorageThemeSettingStore.put(modeSetting);
        setThemeMode(modeSetting);
      }}
    >
      {children}
    </ThemeModeSettingContextProvider>
  );
};
