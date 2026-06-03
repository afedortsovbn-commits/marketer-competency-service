# Marketer Competency Service

## Что это
SPA-сервис для HR-тестирования соискателей. HR создаёт анкету, генерирует QR-код, соискатель сканирует и отвечает на вопросы. HR видит ход тестирования в реальном времени.

## Стек
- **Frontend:** React 19 + TypeScript, Vite 8
- **Backend/DB:** Firebase Realtime Database (без Auth — анонимный доступ)
- **Деплой:** GitHub Pages через GitHub Actions (`.github/workflows/pages.yml`)
- **Роутинг:** Hash-based (`#/test/{sessionId}` для кандидата, без хеша — HR-кабинет)

## Структура файлов
```
src/App.tsx        — Приложение: типы, хуки, компоненты (~2100 строк)
src/App.css        — стили
src/questions.ts   — Банк вопросов: 230 вопросов, 4 раздела, 23 компетенции
src/realtime.ts    — Firebase: init, read, write, subscribe, delete
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
- `TestSession` — сессия тестирования (id, candidate, answers, status, questionIds?, etc.)
- `CandidateGroup` — группировка сессий по candidateId
- `QuestionSection` — раздел вопросов (marketer, analyst, softskills, thinking)
- `CompetencyKey` — `{sectionId, competency}` для идентификации компетенции внутри раздела
- `CompetencyResult` — результат по одной компетенции (correct, total, percent)

### Статусы сессий
`new` → `in_progress` → `completed` / `terminated`

### Типы сессий
- **Старые сессии** (без `questionIds`): привязаны к `assessmentType`, содержат ВСЕ вопросы раздела. Только для отображения результатов.
- **Комбинированные сессии** (с `questionIds`): `assessmentType: 'combined'`, конкретные вопросы из выбранных компетенций. Создаются через «Создать опрос». Только они показывают ActiveSurveyPanel с QR.

## Банк вопросов (`src/questions.ts`)

### 4 раздела, 23 компетенции, по 10 вопросов:
- **Маркетолог** (90): Стратегия, Performance, SEO, SMM, Контент, CRM, Бренд, Исследования, Продуктовый маркетинг
- **Аналитик** (50): SQL и данные, Статистика, Продуктовая аналитика, BI и визуализация, A/B тесты
- **Софтскилы** (50): Стрессоустойчивость, Субординация, Дипломатичность, Самоотдача, Управляемость
- **Мышление** (40): IQ и логика, Глубина мышления, Внимательность, Глубина проработки

### Миграция вопросов
Вопросы кэшируются в localStorage и Firebase. При обновлении банка нужно:
1. Изменить `QUESTIONS_VERSION` в App.tsx (например `'v5-description'`)
2. Миграция `migrateQuestionsIfNeeded()` автоматически перезапишет кэш при загрузке

**Правило:** Если изменил `questions.ts`, ОБЯЗАТЕЛЬНО обнови `QUESTIONS_VERSION`, иначе пользователи увидят старые вопросы.

## Критические моменты (подводные камни)

### 1. Firebase НЕ принимает undefined
Firebase выбрасывает ошибку при записи `undefined`. `saveRemoteState` прогоняет данные через `JSON.parse(JSON.stringify(value))`.

**Правило:** Никогда не присваивать `undefined` полям объектов для Firebase. Использовать `delete` или не включать поле.

### 2. Удаление данных — mergeSessions восстанавливает удалённое
`setSessions` вызывает `mergeSessions(localSessions, ...)` — мерж с localStorage. Если удалить сессию через `saveSessions(filtered)`, мерж вернёт удалённые из localStorage.

**Решение:** Перед `saveSessions` записать отфильтрованные данные напрямую в localStorage через `writeJson(STORAGE_SESSIONS, remaining)`. См. `deleteCandidate`.

**Правило:** При удалении данных ВСЕГДА сначала очищать localStorage, потом вызывать save.

### 3. Массовая перезапись сессий
`setSessions` пишет только в `sessions` (массив). Индивидуальные `sessionsById/{id}` через `saveSessionRecord`.

### 4. useEffect зависимости
НЕ ставить объекты в deps. Использовать `[obj?.id]` + `useRef` для значения. Иначе бесконечные подписки.

### 5. Каскадные ре-рендеры
`sessionsDigest` + `stableSet` в `useStoredSessions` предотвращают лишние обновления.

**Правило:** Использовать `stableSet` вместо `setLocalSessions` (кроме `save`).

### 6. GitHub Pages — источник деплоя
Pages ДОЛЖЕН быть настроен на **GitHub Actions** (не «Deploy from a branch»). Проверить: Settings → Pages → Source = "GitHub Actions". Иначе деплоятся сырые файлы из репо, а не сборка.

### 7. Кэш браузера после деплоя
GitHub Pages агрессивно кэширует. Пользователям может потребоваться Ctrl+Shift+R или очистка кэша. На мобильных — открыть в инкогнито или очистить кэш браузера.

## Потоки данных

### HR создаёт соискателя
`createCandidate` → `createSessionDraft()` → `saveSessionRecord()` → в списке

### HR удаляет соискателя
`deleteCandidate` → `writeJson(STORAGE_SESSIONS, remaining)` → `deleteRemoteState` для каждой сессии → `saveSessions(remaining)`

### HR создаёт комбинированный опрос
«Создать опрос» → `CreateSurveyModal` (выбор компетенций) → `createCombinedSession` → ActiveSurveyPanel с QR

### Кандидат проходит тест
`#/test/{sessionId}` → `CandidateApp` → отвечает → `saveSessionRecord` → Firebase → HR видит в реальном времени

### HR видит результаты
`TestsOverview` → чипы компетенций (чёрный текст, цветная граница). Клик по чипу → показывает вопросы и ответы кандидата.

### Мониторинг прохождения (ActiveSurveyPanel)
- QR-код и ссылка скрываются после начала прохождения (status `in_progress`)
- Показываются: последний вопрос + последний ответ
- Экран кандидата НЕ показывает имя перед стартом

## Компоненты (ключевые)
- **HrApp** — корневой HR-компонент
- **CandidateWorkspace** — список соискателей + карточки
- **CandidateCard** — карточка с табами «Тесты» / «Профиль», кнопка удаления с инлайн-подтверждением
- **TestsOverview** — результаты: чипы компетенций, клик по чипу → Q&A
- **CreateSurveyModal** — выбор компетенций для опроса
- **ActiveSurveyPanel** — QR + мониторинг активного опроса
- **CandidateApp** — экран кандидата (прохождение теста)
- **QuestionCatalog** — редактор банка вопросов (модалка, группировка по компетенциям, нумерация внутри)

## Цветовая схема
Корпоративный зеленый: `--accent: #1b8d4b`, `--accent-2: #2f9d41`. НЕ менять на синий/голубой.
Чипы результатов: чёрный текст `#1a1a1a`, цветная граница `percentToColor()`, фон `percentToBackground()`.
Выбранный чип: зелёный (accent), не синий.

## Команды
```bash
npm run dev      # dev-сервер на localhost:5173
npm run build    # tsc + vite build + sync-pages-root
npm run lint     # eslint
```

## URLs
- **Локалка:** `http://localhost:5173/marketer-competency-service/app.html`
- **Прод:** `https://afedortsovbn-commits.github.io/marketer-competency-service/`

## GitHub Actions
Push в main → lint → build → deploy на GitHub Pages. Если lint падает — деплой не происходит.

## Аккаунты
Первый зарегистрированный = owner (админ). Owner создаёт HR-пользователей. Пароли в Firebase в открытом виде.

## Версии и откат
- **`v4.0-questions-overhaul`** — текущая: 230 вопросов, 4 раздела, удаление соискателей, клик по чипам
- **`v3.2-delete-chips-catalog`** — удаление, чипы, каталог по компетенциям (старые вопросы)
- **`v3.1-survey-ux`** — UX-правки мониторинга
- Откат: `git reset --hard <тег>`
