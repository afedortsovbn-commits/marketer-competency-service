# Marketer Competency Service

## Что это
SPA-сервис для HR-тестирования соискателей. HR создаёт анкету, генерирует QR-код, соискатель сканирует и отвечает на вопросы. HR видит ход тестирования в реальном времени.

## Стек
- **Frontend:** React 19 + TypeScript, Vite 8, single-file SPA (`src/App.tsx` ~3550 строк)
- **Backend/DB:** Firebase Realtime Database (без Auth — анонимный доступ)
- **Деплой:** GitHub Pages через GitHub Actions (`.github/workflows/pages.yml`)
- **Роутинг:** Hash-based (`#/test/{sessionId}` для кандидата, без хеша — HR-кабинет)

## Структура файлов
```
src/App.tsx        — ВСЁ приложение: типы, данные вопросов, хуки, компоненты
src/App.css        — стили
src/realtime.ts    — Firebase: init, read, write, subscribe
src/main.tsx       — точка входа React
app.html           — HTML-шаблон (Vite input)
vite.config.ts     — base: '/marketer-competency-service/'
scripts/sync-pages-root.mjs — копирует dist/app.html → dist/index.html для Pages
.env.production    — Firebase credentials (ЗАКОММИЧЕНЫ в репо)
.env.local         — то же для dev
```

## Архитектура данных

### Firebase Realtime Database
Путь: `pollSlideStudioState/users/marketerCompetencyService/`
- `sessionsById/{id}` — индивидуальные записи сессий (ОСНОВНОЙ источник)
- `sessions` — массив всех сессий (fallback, пишется через `setSessions`)
- `users` — аккаунты HR
- `questionSections` — банк вопросов

### Ключевые типы
- `TestSession` — сессия тестирования (id, candidate, answers, status, etc.)
- `CandidateGroup` — группировка сессий по candidateId
- `QuestionSection` — раздел вопросов (marketer, analyst, skills)

### Статусы сессий
`new` → `in_progress` → `completed` / `terminated`

## Критические моменты (подводные камни)

### 1. Firebase НЕ принимает undefined
**Самый важный баг, который мы чинили.** Firebase Realtime Database выбрасывает ошибку при записи объектов с `undefined`-значениями. Функция `mergeSessionPair` создавала `finishedAt: undefined` для сессий в статусе in_progress. Ошибка ловилась try/catch молча — запись пропадала без следа.

**Решение:** `saveRemoteState` прогоняет данные через `JSON.parse(JSON.stringify(value))` перед записью. Это убирает все undefined, NaN, функции.

**Правило:** Никогда не присваивать `undefined` полям объектов, которые пойдут в Firebase. Использовать `delete` или просто не включать поле.

### 2. Массовая перезапись сессий
Ранее `setSessions` писал КАЖДУЮ сессию в `sessionsById/{id}` индивидуально. С 20+ сессиями это вызывало 20+ callback'ов от `onValue` подписки → 20+ setState → каскадный ре-рендер → браузер зависал.

**Решение:** `setSessions` пишет только в `sessions` (массив). Индивидуальные записи в `sessionsById` делаются через `saveSessionRecord` только там, где сессия реально меняется.

### 3. useEffect зависимости
`AssessmentTab` подписка на Firebase зависела от `[baseSession]` (объект). Новый объект при каждом ре-рендере → подписка пересоздавалась. Заменено на `[baseSession?.id]` + `useRef` для значения.

### 4. subscribeRemoteState без error callback
Firebase `onValue` без error callback молча теряет ошибки permission denied. Добавлен error callback, который вызывает `onChange(fallback)`.

## Потоки данных

### HR создаёт сессию
`createCandidate` / `ensureSession` → `createSessionDraft()` → `saveSessionRecord()` пишет в `sessionsById/{id}` → QR генерируется из `session.id`

### Кандидат проходит тест
URL: `#/test/{sessionId}` → `CandidateApp` → `readSessionRecord(id)` + `subscribeRemoteState` → кандидат отвечает → `updateSession` → `saveSessionRecord(updated)` пишет в Firebase

### HR видит прогресс
`AssessmentTab` → `subscribeRemoteState(sessionsById/{id})` → `setLiveSession` → UI обновляется

### Повторное тестирование
`restartSession` → старая сессия `terminated` → новая сессия с новым `id` → `saveSessionRecord` для обеих → QR обновляется

## Команды
```bash
npm run dev      # dev-сервер на localhost:5173
npm run build    # tsc + vite build + sync-pages-root
npm run lint     # eslint
```

## GitHub Actions
Push в main → lint → build → deploy на GitHub Pages. Если lint падает — деплой не происходит.

## Аккаунты
Первый зарегистрированный пользователь = owner (админ). Owner может создавать других HR-пользователей. Пароли хранятся в Firebase в открытом виде (без хеширования).
