// В Android WebView по умолчанию стоит setMediaPlaybackRequiresUserGesture(true), а мобильные
// браузеры блокируют автоплей со звуком. В обоих случаях autoPlay молча не срабатывает,
// и выглядит это как «собеседник не подключился».
export const playMediaElement = async (element: HTMLMediaElement): Promise<boolean> => {
  try {
    await element.play();
    return true;
  } catch {
    return false;
  }
};
