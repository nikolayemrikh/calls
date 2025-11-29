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
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(username);
  const [peerUsername, setPeerUsername] = useState('');

  return (
    <PageMain>
      <Stack direction="column" flexGrow={1} alignItems="center" justifyContent="center">
        <Stack direction="row" justifyContent="center" width="100%">
          <Card sx={{ padding: 4, flexBasis: 500 }}>
            <Stack direction="column" gap={2}>
              <Typography variant="h1">Видеозвонки</Typography>

              {match([username, isChangingUsername])
                .when(
                  ([username, isChangingUsername]) => !!username && !isChangingUsername,
                  () => (
                    <Stack direction="row" alignItems="center" gap={2}>
                      <Typography variant="body1">Ваш юзернейм: {username}</Typography>
                      <Button
                        onClick={() => {
                          setIsChangingUsername(true);
                        }}
                      >
                        Изменить
                      </Button>
                    </Stack>
                  )
                )
                .otherwise(() => {
                  const handleSubmit = () => {
                    localStorage.setItem(ELocalStorageKey.Username, currentUsername);
                    setUsername(currentUsername);
                    setCurrentUsername('');
                    setIsChangingUsername(false);
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
                      <Stack direction="row" alignItems="center" gap={2}>
                        <Button type="submit" variant="contained" fullWidth>
                          Сохранить
                        </Button>
                        {username && (
                          <Button
                            fullWidth
                            onClick={() => {
                              setIsChangingUsername(false);
                            }}
                          >
                            Отменить
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  );
                })}

              <Stack direction="column" gap={2}>
                <Typography variant="body1">Звонок пользователю</Typography>
                <TextField
                  value={peerUsername}
                  onChange={(e) => setPeerUsername(e.target.value)}
                  placeholder="Юзернейм"
                  helperText={username === peerUsername && 'Введите юзернейм собеседника, а не свой'}
                  error={username === peerUsername}
                />
                <Button
                  variant="contained"
                  disabled={!peerUsername || username === peerUsername}
                  onClick={() => {
                    navigate(routes.call + '/' + peerUsername);
                  }}
                >
                  Позвонить
                </Button>

                <Typography variant="body2" textAlign="center">
                  После нажатия на кнопку "Позвонить" <br /> дождитесь подключения собеседника
                </Typography>
                <Typography variant="body2" textAlign="center">
                  Собеседник должен ввести ваш юзернейм <br /> и тоже нажать "Позвонить"
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </PageMain>
  );
};
