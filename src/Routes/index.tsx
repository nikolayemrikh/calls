import { FC } from 'react';

import { Route, Routes as RouterRoutes } from 'react-router-dom';

import { PeerChat } from '@app/PeerChat';
import { PeerLobby } from '@app/PeerLobby';
import { PeerVideo } from '@app/PeerVideo';
import { routes } from './routes';

export const Routes: FC = () => {
  return (
    <RouterRoutes>
      <Route path={routes.lobby} element={<PeerLobby />} />
      <Route path={`${routes.chat}/:id`} element={<PeerChat />} />
      <Route path={`${routes.video}/:id`} element={<PeerVideo />} />
    </RouterRoutes>
  );
};
