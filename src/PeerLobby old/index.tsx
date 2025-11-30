import { routes } from '@app/Routes/routes';
import { PageMain } from '@app/components/PageMain';
import {} from '@app/core/crypto/keyManagement';
import { ELocalStorageKey } from '@app/core/localStorage/constants';
import {} from '@app/core/peer/types';
import { Button, Card, Stack, TextField, Typography } from '@mui/material';
import { FC, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { match } from 'ts-pattern';

const getPreviousCallsUsernames = (): string[] => {
  return JSON.parse(localStorage.getItem(ELocalStorageKey.PreviousCallsUsernames) ?? '[]');
};

export const PeerLobby: FC = () => {
  const navigate = useNavigate();

  const previousCallsUsernames = useMemo(() => getPreviousCallsUsernames(), []);
  const [username, setUsername] = useState(localStorage.getItem(ELocalStorageKey.Username) ?? '');
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [currentUsername, setCurrentUsername] = useState(username);
  const [peerUsername, setPeerUsername] = useState('');

  const handleCallSubmit = () => {
    navigate(routes.call + '/' + peerUsername);
    localStorage.setItem(
      ELocalStorageKey.PreviousCallsUsernames,
      JSON.stringify([...previousCallsUsernames, peerUsername])
    );
  };

  return (
    <PageMain>
      <Stack direction="column" flexGrow={1} gap={4} alignItems="center" justifyContent="center">
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
                        autoCapitalize="none"
                        autoCorrect="off"
                        autoComplete="off"
                        value={currentUsername}
                        onChange={(e) => setCurrentUsername(e.target.value.toLowerCase())}
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

              <Stack
                direction="column"
                gap={2}
                component="form"
                onSubmit={(evt) => {
                  evt.preventDefault();
                  handleCallSubmit();
                }}
              >
                <Typography variant="body1">Звонок пользователю</Typography>
                <TextField
                  value={peerUsername}
                  onChange={(e) => setPeerUsername(e.target.value.toLowerCase())}
                  placeholder="Юзернейм"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  helperText={!!username && username === peerUsername && 'Введите юзернейм собеседника, а не свой'}
                  error={!!username && username === peerUsername}
                />
                <Button
                  variant="contained"
                  disabled={!peerUsername || username === peerUsername}
                  onClick={() => {
                    handleCallSubmit();
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

        <Stack direction="row" justifyContent="center" width="100%">
          <Card sx={{ padding: 4, flexBasis: 500 }}>
            <Stack direction="column" gap={2}>
              <Typography variant="h2">Предыдущие вызовы</Typography>

              <Stack direction="column" gap={2}>
                {previousCallsUsernames.map((previousCallUsername) => {
                  return (
                    <Stack
                      key={previousCallUsername}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      gap={2}
                    >
                      <Typography variant="body1">{previousCallUsername}</Typography>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          navigate(routes.call + '/' + previousCallUsername);
                        }}
                      >
                        Позвонить
                      </Button>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </Stack>
    </PageMain>
  );
};
