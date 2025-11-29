import { CssBaseline, ThemeProvider as MuiThemeProvider, Theme } from '@mui/material';
import { FC, ReactNode } from 'react';
import { useThemeMode } from '../ThemeModeSettingContext/hooks/useThemeMode/useThemeMode';
import { EThemeMode } from '../ThemeModeSettingContext/types';
import { createTheme } from '../create-theme';

const lightTheme = createTheme(EThemeMode.Light);
const darkTheme = createTheme(EThemeMode.Dark);

const themeMap: Record<EThemeMode, Theme> = {
  [EThemeMode.Light]: lightTheme,
  [EThemeMode.Dark]: darkTheme,
};

export const ThemeProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const mode = useThemeMode();

  return (
    <MuiThemeProvider theme={themeMap[mode]}>
      <CssBaseline enableColorScheme />
      {children}
    </MuiThemeProvider>
  );
};
