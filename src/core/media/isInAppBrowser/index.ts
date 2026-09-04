const IN_APP_BROWSER_PATTERN = /FBAN|FBAV|FB_IAB|Instagram|VKAndroidApp|OKApp|MicroMessenger|Line\/|TikTok|Twitter/i;

const ANDROID_WEBVIEW_PATTERN = /;\s?wv[);]/i;

export const isInAppBrowser = (): boolean => {
  const userAgent = navigator.userAgent;

  return ANDROID_WEBVIEW_PATTERN.test(userAgent) || IN_APP_BROWSER_PATTERN.test(userAgent);
};
