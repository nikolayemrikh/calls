import { Stack, useTheme } from '@mui/material';
import { FC, ReactNode } from 'react';

export const PageMain: FC<{ children: ReactNode }> = ({ children }) => {
  const theme = useTheme();

  return (
    <Stack component="main" direction="row" justifyContent="center" flexGrow={1} height="100%">
      <Stack
        height="100%"
        direction="column"
        flexGrow={1}
        maxWidth={`min(100%, ${theme.breakpoints.values.xl}px)`}
        padding={2}
        sx={(t) => ({
          [t.breakpoints.up('sm')]: {
            padding: 4,
          },
        })}
      >
        {children}
      </Stack>
    </Stack>
  );
};
