import { FC, useCallback, useMemo } from 'react';
import { ThemeModeSettingContext } from '../context';
import { IThemeModeSettingContext } from '../types';
import { EThemeModeSetting } from '../types';
import { IThemeModeSettingContextProviderProps } from '../types';

export const ThemeModeSettingContextProvider: FC<IThemeModeSettingContextProviderProps> = (props) => {
  const { children, modeSetting, onModeSettingChange } = props;

  const changeModeSetting = useCallback(
    (setting: EThemeModeSetting): void => {
      onModeSettingChange(setting);
    },
    [onModeSettingChange]
  );

  const value: IThemeModeSettingContext = useMemo(
    () => ({ modeSetting, changeModeSetting }),
    [modeSetting, changeModeSetting]
  );

  return <ThemeModeSettingContext.Provider value={value}>{children}</ThemeModeSettingContext.Provider>;
};
