import { createContext } from 'react';

import { IThemeModeSettingContext } from './types';

export const ThemeModeSettingContext = createContext<IThemeModeSettingContext | null>(null);
