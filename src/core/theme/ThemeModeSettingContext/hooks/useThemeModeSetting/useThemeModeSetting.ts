import { createUseProvidedContext } from '@app/core/createUseProvidedContext/createUseProvidedContext';
import { ThemeModeSettingContext } from '../../context';
import { IThemeModeSettingContext } from '../../types';

/** @asserts that theme setting context provided */
export const useThemeModeSetting = createUseProvidedContext<IThemeModeSettingContext>(
  ThemeModeSettingContext,
  'ThemeModeSettingContext'
);
