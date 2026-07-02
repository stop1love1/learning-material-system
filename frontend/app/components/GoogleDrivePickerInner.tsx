'use client';
import React from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { Btn } from '@/app/components/ui';
import { notifyError } from '@/app/lib/ui/dialogs';
import { useGoogleConfig } from '@/app/lib/google-config';

const TOKEN_KEY = 'gdrive-token';

export default function GoogleDrivePickerInner({
  p,
  onPicked,
  multiselect = true,
  label = 'Kéo từ Google Drive',
  variant = 'ghost',
  full = false,
}: {
  p: any;
  onPicked: (docs: any[]) => void;
  multiselect?: boolean;
  label?: string;
  variant?: string;
  full?: boolean;
}) {
  const { clientId: CLIENT_ID, apiKey: API_KEY } = useGoogleConfig();
  const [openPicker, authResponse] = useDrivePicker();
  const [token, setToken] = React.useState<string>(() => {
    try { return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) || '' : ''; } catch { return ''; }
  });

  React.useEffect(() => {
    if (authResponse && !token) {
      setToken(authResponse.access_token);
      try { localStorage.setItem(TOKEN_KEY, authResponse.access_token); } catch {}
    }
  }, [authResponse, token]);

  const handleOpen = () => {
    if (!CLIENT_ID || !API_KEY) {
      notifyError(
        'Chưa cấu hình Google Drive Picker',
        'Vào Cài đặt → Tích hợp để nhập Google Client ID và API Key (hoặc đặt biến môi trường NEXT_PUBLIC_GOOGLE_* rồi build lại).',
      );
      return;
    }
    openPicker({
      clientId: CLIENT_ID,
      developerKey: API_KEY,
      viewId: 'DOCS',
      token: token || undefined,
      showUploadView: true,
      showUploadFolders: true,
      supportDrives: true,
      multiselect,
      callbackFunction: (data: any) => {
        if (data.action === 'picked' && Array.isArray(data.docs) && data.docs.length) {
          onPicked(data.docs);
        }
      },
    });
  };

  return <Btn p={p} variant={variant as any} icon="cloud" full={full} onClick={handleOpen}>{label}</Btn>;
}
