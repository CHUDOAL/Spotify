# Spotify Twitch Widget

Этот виджет отображает текущую музыку из Spotify в OBS.

## Установка

1.  **Установите Node.js**: Скачайте и установите Node.js с [nodejs.org](https://nodejs.org/).
2.  **Установите зависимости**: Откройте терминал в этой папке и запустите:
    ```bash
    npm install
    ```

## Настройка Spotify API

1.  Зайдите на [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/).
2.  Создайте новое приложение ("Create app").
3.  В настройках приложения (Settings) найдите **Redirect URIs** и добавьте:
    `http://localhost:8888/callback`
4.  Скопируйте **Client ID** и **Client Secret**.

## Конфигурация

1.  Переименуйте файл `env_config.txt` в `.env`.
2.  Откройте `.env` и вставьте ваши ключи:
    ```env
    SPOTIFY_CLIENT_ID=ваш_client_id
    SPOTIFY_CLIENT_SECRET=ваш_client_secret
    REDIRECT_URI=http://localhost:8888/callback
    PORT=8888
    ```

## Запуск

1.  Запустите сервер:
    ```bash
    npm start
    ```
2.  В консоли появится инструкция. Перейдите по ссылке `http://localhost:8888/login` в браузере, чтобы войти в Spotify.
3.  После успешного входа вы увидите сообщение "Login successful".

## Добавление в OBS

1.  В OBS добавьте новый источник **Browser** (Браузер).
2.  В поле URL вставьте: `http://localhost:8888`
3.  Установите ширину (Width) 350 и высоту (Height) 100.
4.  Поставьте галочку "Shutdown source when not visible" и "Refresh browser when scene becomes active" (по желанию).

Теперь виджет будет показывать музыку, когда она играет в Spotify!

