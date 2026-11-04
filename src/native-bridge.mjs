import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// Ce fichier est inerte dans un navigateur classique. Il améliore uniquement
// le comportement de la WebView Android/iOS de Capacitor.
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('capacitor-native');
  document.documentElement.dataset.platform = Capacitor.getPlatform();

  const externalBrowserHosts = new Set([
    'wa.me',
    'api.whatsapp.com',
    'maps.app.goo.gl',
    'www.google.com',
    'maps.google.com',
  ]);

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const anchor = target?.closest?.('a[href]');
    if (!anchor || anchor.hasAttribute('download')) return;

    let url;
    try {
      url = new URL(anchor.href, window.location.href);
    } catch {
      return;
    }

    // Le numéroteur, l'application e-mail et les SMS doivent être lancés
    // par le système plutôt que chargés dans la WebView.
    if (['tel:', 'mailto:', 'sms:'].includes(url.protocol)) {
      event.preventDefault();
      window.location.href = url.href;
      return;
    }

    const isHttp = url.protocol === 'http:' || url.protocol === 'https:';
    const isExternal = isHttp && url.origin !== window.location.origin;
    const mustUseSystemBrowser =
      externalBrowserHosts.has(url.hostname) || anchor.target === '_blank';

    if (isExternal && mustUseSystemBrowser) {
      event.preventDefault();
      Browser.open({ url: url.href }).catch(() => {
        window.location.href = url.href;
      });
    }
  }, true);

  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      App.exitApp();
    }
  });
}
