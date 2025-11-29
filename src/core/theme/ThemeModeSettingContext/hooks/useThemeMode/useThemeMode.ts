import { EThemeMode } from '@app/core/theme/ThemeModeSettingContext/types';
import { useMediaQuery } from '@mui/material';
import { useThemeModeSetting } from '../useThemeModeSetting/useThemeModeSetting';
import { determineThemeToApply } from './helpers/determineThemeToApply/determineThemeToApply';

export const useThemeMode = (): EThemeMode => {
  const { modeSetting } = useThemeModeSetting();
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  return determineThemeToApply(modeSetting, prefersDarkMode);
};
