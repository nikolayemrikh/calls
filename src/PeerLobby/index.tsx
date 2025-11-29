import { routes } from '@app/Routes/routes';
import { PageMain } from '@app/components/PageMain';
import {} from '@app/core/crypto/keyManagement';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import {} from '@app/core/peer/types';
import { Button, Card, Stack, TextField, Typography } from '@mui/material';
import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';

export const PeerLobby: FC = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState(localStorage.getItem(ELocalStorageKey.Username) ?? '');
  const [currentUsername, setCurrentUsername] = useState(username);
  const [peerUsername, setPeerUsername] = useState('');

  return (
    <PageMain>
      <Stack direction="row" justifyContent="center">
        <Card sx={{ padding: 4, flexBasis: 500 }}>
          <Stack direction="column" gap={2}>
            <Typography variant="h1">Видеозвонки</Typography>

            {match(username)
              .when(
                (u) => !!u,
                () => (
                  <Stack direction="column" gap={2}>
                    <Typography variant="body1">Юзернейм: {username}</Typography>
                    <Button
                      onClick={() => {
                        localStorage.removeItem(ELocalStorageKey.Username);
                        setUsername('');
                      }}
                    >
                      Сменить юзернейм
                    </Button>
                  </Stack>
                )
              )
              .otherwise(() => {
                const handleSubmit = () => {
                  localStorage.setItem(ELocalStorageKey.Username, currentUsername);
                  setUsername(currentUsername);
                  setCurrentUsername('');
                };
                return (
                  <Stack
                    direction="column"
                    gap={2}
                    component="form"
                    onSubmit={(evt) => {
                      evt.preventDefault();
                      handleSubmit();
                    }}
                  >
                    <Typography variant="body1">Придумайте юзернейм</Typography>
                    <TextField
                      autoCapitalize="off"
                      value={currentUsername}
                      onChange={(e) => setCurrentUsername(e.target.value)}
                    />
                    <Button type="submit">Сохранить</Button>
                  </Stack>
                );
              })}

            <Stack direction="column" gap={2}>
              <Typography variant="body1">Звонок пользователю</Typography>
              <TextField
                value={peerUsername}
                onChange={(e) => setPeerUsername(e.target.value)}
                placeholder="Юзернейм"
              />
              <Button
                disabled={!peerUsername}
                onClick={() => {
                  navigate(routes.call + '/' + peerUsername);
                }}
              >
                Позвонить
              </Button>
            </Stack>
          </Stack>
        </Card>
      </Stack>
    </PageMain>
  );
};
