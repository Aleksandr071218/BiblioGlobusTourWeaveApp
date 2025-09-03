# Руководство по настройке CI/CD и управлению секретами

Этот документ содержит пошаговую инструкцию по настройке автоматического развертывания (CI/CD) для проекта в **Firebase App Hosting** с использованием **GitHub Actions**. Все секреты будут безопасно управляться через **Google Secret Manager**.

## Часть 1. Управление секретами в Google Secret Manager

**Цель:** Консолидировать все секреты в Google Secret Manager, удалив разрозненные и небезопасные переменные.

### 1.1. Очистка и консолидация конфигурации Firebase

1.  **Удалите старые секреты Firebase:**
    В Google Secret Manager найдите и удалите следующие отдельные секреты. Они больше не нужны и будут заменены единым конфигурационным объектом.
    - `MY_FIREBASE_API_KEY`
    - `MY_FIREBASE_APP_ID`
    - `MY_FIREBASE_AUTH_DOMAIN`
    - `MY_FIREBASE_MESSAGING_SENDER_ID`
    - `MY_FIREBASE_PROJECT_ID`
    - `MY_FIREBASE_STORAGE_BUCKET`

2.  **Создайте новый единый секрет:**
    - **Имя секрета:** `NEXT_PUBLIC_FIREBASE_CONFIG`
      *(Примечание: префикс `NEXT_PUBLIC_` используется, так как Next.js требует его для переменных окружения, доступных на клиенте. Код в `src/lib/firebase.ts` ожидает именно это имя.)*
    - **Значение секрета:** Вставьте полный JSON-объект конфигурации вашего веб-приложения Firebase. Убедитесь, что все ключи и строковые значения заключены в двойные кавычки.

    **Шаблон значения:**
    ```json
    {
      "apiKey": "ВАШ_API_КЛЮЧ",
      "authDomain": "biblioglobustourweaveapp.firebaseapp.com",
      "projectId": "biblioglobustourweaveapp",
      "storageBucket": "biblioglobustourweaveapp.firebasestorage.app",
      "messagingSenderId": "77706967342",
      "appId": "1:77706967342:web:e7d3f223b915aae0c462bf"
    }
    ```
    *(Примечание: поле `measurementId` является необязательным и может отсутствовать, если для проекта не подключена Google Analytics.)*

### 1.2. Проверка остальных секретов

Убедитесь, что в Secret Manager существуют следующие секреты, необходимые для работы API:
- `BIBLIO_GLOBUS_LOGIN`
- `BIBLIO_GLOBUS_PASSWORD`
- `GOOGLE_PLACES_API_KEY`

### 1.3. Автоматически управляемые секреты

Секрет с именем, похожим на `apphosting-github-conn-*`, создается и управляется Firebase App Hosting для связи с вашим GitHub-репозиторием. **Не удаляйте и не изменяйте его.**

## Часть 2. Настройка переменных окружения в Firebase App Hosting

**Цель:** Связать переменные окружения, которые использует ваше приложение, с секретами в Secret Manager.

1.  Перейдите в консоль Firebase -> App Hosting.
2.  Выберите ваш бэкенд (`studio`).
3.  В настройках бэкенда перейдите к управлению переменными окружения.
4.  Настройте следующие переменные, связав каждую с соответствующим секретом из Secret Manager:

| Имя переменной окружения         | Секрет в Secret Manager          |
| -------------------------------- | -------------------------------- |
| `NEXT_PUBLIC_FIREBASE_CONFIG`    | `NEXT_PUBLIC_FIREBASE_CONFIG`    |
| `BIBLIO_GLOBUS_LOGIN`            | `BIBLIO_GLOBUS_LOGIN`            |
| `BIBLIO_GLOBUS_PASSWORD`         | `BIBLIO_GLOBUS_PASSWORD`         |
| `GOOGLE_PLACES_API_KEY`          | `GOOGLE_PLACES_API_KEY`          |

### 2.1. Предоставление доступа к секретам

**Это критически важный шаг.** Чтобы ваш бэкенд App Hosting мог читать секреты из Secret Manager во время сборки и выполнения, его сервисный аккаунт должен иметь соответствующие права.

Выполните следующую команду в вашем терминале (требуется Firebase CLI):
```bash
firebase apphosting:secrets:grantaccess NEXT_PUBLIC_FIREBASE_CONFIG,BIBLIO_GLOBUS_LOGIN,BIBLIO_GLOBUS_PASSWORD,GOOGLE_PLACES_API_KEY --backend=studio
```
Эта команда автоматически предоставит сервисному аккаунту вашего бэкенда (`firebase-app-hosting-compute@...`) роль "Secret Manager Secret Accessor" для указанных секретов.

## Часть 3. Настройка GitHub для безопасного CI/CD

**Цель:** Настроить GitHub Actions для автоматического развертывания при каждом коммите в `main`, используя безопасную аутентификацию без долгоживущих ключей.

### 3.1. Очистка секретов репозитория GitHub

1.  Перейдите в настройки вашего репозитория на GitHub (`Settings` -> `Secrets and variables` -> `Actions`).
2.  **Удалите все старые секреты**, которые теперь управляются через Google Secret Manager:
    - `MY_FIREBASE_*` (все переменные)
    - `BIBLIO_GLOBUS_LOGIN`
    - `BIBLIO_GLOBUS_PASSWORD`
    - `GOOGLE_PLACES_API_KEY`
    - `FIREBASE_PROJECT_ID`
3.  **Настоятельно рекомендуется удалить секрет `FIREBASE_SERVICE_ACCOUNT`**. Хранение JSON-ключа сервисного аккаунта в секретах GitHub является устаревшей и менее безопасной практикой. Мы заменим его на Workload Identity Federation.

### 3.2. Настройка Workload Identity Federation

Это современный и безопасный способ предоставить рабочим процессам GitHub Actions доступ к ресурсам Google Cloud.

1.  **Создайте Workload Identity Pool и Provider** в вашем Google Cloud проекте.
2.  **Создайте сервисный аккаунт (SA)** (или используйте существующий), который будет выполнять развертывание.
3.  **Предоставьте SA необходимые роли**:
    - `Firebase App Hosting Admin` (для развертывания в App Hosting)
    - `Secret Manager Secret Accessor` (для доступа к секретам, если это необходимо в CI/CD, хотя в нашем случае это не требуется, так как секреты подставляются самим App Hosting)
    - `Service Account User`
4.  **Свяжите SA с вашим репозиторием GitHub**, предоставив ему право олицетворять SA через Workload Identity Provider.

*Примечание: Подробные команды `gcloud` для этих шагов можно найти в официальной документации Google Cloud.*

### 3.3. Создание воркфлоу GitHub Actions

1.  Создайте файл `.github/workflows/deploy.yml` в корне вашего проекта.
2.  Вставьте в него следующее содержимое:

```yaml
name: Deploy to Firebase App Hosting

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write # Необходимо для аутентификации в Google Cloud

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/YOUR_PROJECT_NUMBER/locations/global/workloadIdentityPools/YOUR_POOL_ID/providers/YOUR_PROVIDER_ID'
          service_account: 'YOUR_SERVICE_ACCOUNT_EMAIL'

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Firebase CLI
        run: npm install -g firebase-tools

      - name: Deploy to Firebase App Hosting
        run: firebase apphosting:deploy --project YOUR_FIREBASE_PROJECT_ID --backend studio
```

**Важные замечания по воркфлоу:**
- Замените `YOUR_PROJECT_NUMBER`, `YOUR_POOL_ID`, `YOUR_PROVIDER_ID`, `YOUR_SERVICE_ACCOUNT_EMAIL` и `YOUR_FIREBASE_PROJECT_ID` на ваши реальные значения.
- **Как это работает:**
    - `google-github-actions/auth` получает кратковременный токен доступа для вашего сервисного аккаунта.
    - `firebase-actions/apphosting-deploy` использует этот токен для аутентификации и *запускает* процесс сборки и развертывания в Firebase App Hosting.
    - Сами секреты (`NEXT_PUBLIC_FIREBASE_CONFIG` и др.) **не передаются** в GitHub Actions. Они будут безопасно внедрены в ваше приложение уже на стороне Google Cloud во время сборки, согласно настройкам переменных окружения, которые вы задали в Части 2.

После выполнения всех этих шагов, каждый коммит в ветку `main` будет автоматически запускать безопасное развертывание вашего приложения.