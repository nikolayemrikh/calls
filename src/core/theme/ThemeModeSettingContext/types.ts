import { ReactNode } from 'react';

export interface IThemeModeSettingContextProviderProps {
  children: ReactNode;
  modeSetting: EThemeModeSetting;
  // getModeSetting: () => EThemeModeSetting | null;
  onModeSettingChange: (modeSetting: EThemeModeSetting) => void;
}

export interface IThemeModeSettingContext {
  modeSetting: EThemeModeSetting;
  changeModeSetting: (modeSetting: EThemeModeSetting) => void;
}

/** Represents theme mode that will be applied to whole user interface */
export enum EThemeMode {
  Dark = 'dark',
  Light = 'light',
}

/** Represents theme setting visible to user */
export enum EThemeModeSetting {
  /** Will apply EThemeMode.Dark */
  Dark = 'dark',
  /** Will apply EThemeMode.Light */
  Light = 'light',
  /** Dynamically match device's theme — will apply EThemeMode.Dark or EThemeMode.Light */
  System = 'system',
}
