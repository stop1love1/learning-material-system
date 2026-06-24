'use client';
// Client-only wrapper (the Google Picker loads gapi + must not run during SSR).
import dynamic from 'next/dynamic';

const GoogleDrivePicker = dynamic(() => import('./GoogleDrivePickerInner'), { ssr: false });

export default GoogleDrivePicker;
