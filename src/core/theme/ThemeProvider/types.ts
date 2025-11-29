import { Theme } from '@mui/material';

export interface IThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}
