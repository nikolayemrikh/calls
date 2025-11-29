import { EThemeMode } from '@app/core/theme/ThemeModeSettingContext/types';
import { EThemeModeSetting } from '@app/core/theme/ThemeModeSettingContext/types';

/**
 * Determine theme to apply based on theme setting and device preferrable mode (dark or light)
 * @param themeModeSetting theme setting (system / dark / light)
 * @param devicePrefersDarkMode do device prefers dark mode over light
 * @returns theme to apply (light or dark)
 */
export const determineThemeToApply = (
  themeModeSetting: EThemeModeSetting,
  devicePrefersDarkMode: boolean
): EThemeMode => {
  if (themeModeSetting === EThemeModeSetting.System) return devicePrefersDarkMode ? EThemeMode.Dark : EThemeMode.Light;

  return themeModeSetting === EThemeModeSetting.Dark ? EThemeMode.Dark : EThemeMode.Light;
};
