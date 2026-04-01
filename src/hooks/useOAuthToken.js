import { useEffect } from 'react';
import { setEinstellung } from '../lib/db';

export function useOAuthToken() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('access_token')) return;

    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    if (!token) return;

    const dienst = sessionStorage.getItem('oauthDienst');
    const tokenKeys = {
      google: 'googleAccessToken',
      onedrive: 'onedriveAccessToken',
      dropbox: 'dropboxAccessToken',
    };

    const key = dienst ? tokenKeys[dienst] : 'googleAccessToken';
    if (key) {
      setEinstellung(key, token).then(() => {
        sessionStorage.removeItem('oauthDienst');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        const name = dienst === 'google' ? 'Google Drive' : dienst === 'onedrive' ? 'OneDrive' : 'Dropbox';
        alert(`✓ ${name} erfolgreich verbunden! Bitte nochmal auf "Teilen" klicken.`);
      });
    } else {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, []);
}
