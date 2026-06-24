'use client';
// Google Drive Picker — lets an admin pull files straight from their Google Drive
// into the library. Adapted from the reference edusoft-lms GoogleDrivePicker.tsx,
// rewritten to use the design's own Btn (not antd) + localStorage token + env keys.
import React from 'react';
import useDrivePicker from 'react-google-drive-picker';
import { Btn } from '@/app/components/ui';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';
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
      alert('Chưa cấu hình Google Drive Picker.\nHãy đặt NEXT_PUBLIC_GOOGLE_CLIENT_ID và NEXT_PUBLIC_GOOGLE_API_KEY trong frontend/.env.local rồi build lại.');
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
