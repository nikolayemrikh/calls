import { isAudioOutputSelectionSupported } from '@app/core/media/isAudioOutputSelectionSupported';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FC } from 'react';

type TProps = {
  isOpen: boolean;
  onClose: () => void;
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  audioInputDeviceId: string | null;
  onAudioInputDeviceIdChange: (deviceId: string) => void;
  audioOutputDeviceId: string | null;
  onAudioOutputDeviceIdChange: (deviceId: string) => void;
};

const getDeviceLabel = (device: MediaDeviceInfo, index: number) => device.label || `Устройство ${index + 1}`;

const getSelectValue = (devices: MediaDeviceInfo[], deviceId: string | null) =>
  devices.some((device) => device.deviceId === deviceId) ? (deviceId ?? '') : '';

export const SettingsDialog: FC<TProps> = ({
  isOpen,
  onClose,
  audioInputDevices,
  audioOutputDevices,
  audioInputDeviceId,
  onAudioInputDeviceIdChange,
  audioOutputDeviceId,
  onAudioOutputDeviceIdChange,
}) => {
  const isOutputSelectionSupported = isAudioOutputSelectionSupported();

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Настройки</DialogTitle>
      <DialogContent>
        <Stack direction="column" gap={3} paddingTop={1}>
          <TextField
            select
            fullWidth
            label="Микрофон"
            value={getSelectValue(audioInputDevices, audioInputDeviceId)}
            onChange={(event) => {
              onAudioInputDeviceIdChange(event.target.value);
            }}
            disabled={audioInputDevices.length === 0}
            helperText={audioInputDevices.length === 0 ? 'Микрофоны не найдены' : undefined}
          >
            {audioInputDevices.map((device, index) => (
              <MenuItem key={device.deviceId} value={device.deviceId}>
                {getDeviceLabel(device, index)}
              </MenuItem>
            ))}
          </TextField>

          {isOutputSelectionSupported ? (
            <TextField
              select
              fullWidth
              label="Динамик"
              value={getSelectValue(audioOutputDevices, audioOutputDeviceId)}
              onChange={(event) => {
                onAudioOutputDeviceIdChange(event.target.value);
              }}
              disabled={audioOutputDevices.length === 0}
              helperText={audioOutputDevices.length === 0 ? 'Устройства вывода не найдены' : undefined}
            >
              {audioOutputDevices.map((device, index) => (
                <MenuItem key={device.deviceId} value={device.deviceId}>
                  {getDeviceLabel(device, index)}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography variant="body2">
              Этот браузер не умеет выбирать устройство вывода — оно берётся из настроек системы.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Закрыть</Button>
      </DialogActions>
    </Dialog>
  );
};
