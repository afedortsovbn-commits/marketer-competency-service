# Marketer Competency Service

## Что это
SPA-сервис для HR-тестирования соискателей. HR создаёт анкету, генерирует QR-код, соискатель сканирует и отвечает на вопросы. HR видит ход тестирования в реальном времени.

## Стек
- **Frontend:** React 19 + TypeScript, Vite 8, single-file SPA (`src/App.tsx` ~4100 строк)
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
- `TestSession` — сессия тестирования (id, candidate, answers, status, questionIds?, etc.)
- `CandidateGroup` — группировка сессий по candidateId
- `QuestionSection` — раздел вопросов (marketer, analyst, skills)
- `CompetencyKey` — `{sectionId, competency}` для идентификации компетенции внутри раздела
- `CompetencyResult` — результат по одной компетенции (correct, total, percent)

### Статусы сессий
`new` → `in_progress` → `completed` / `terminated`

### Типы сессий
- **Старые сессии** (без `questionIds`): привязаны к `assessmentType` ('marketer', 'analyst', 'skills'), содержат ВСЕ вопросы раздела. Используются только для отображения результатов.
- **Комбинированные сессии** (с `questionIds`): `assessmentType: 'combined'`, содержат конкретные вопросы из выбранных компетенций. Создаются через модалку «Создать опрос». Только такие сессии показывают ActiveSurveyPanel с QR-кодом.

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

### 5. Каскадные ре-рендеры при обновлении сессий
`useStoredSessions` подписывается на Firebase и периодически синхронизирует localStorage. Каждая синхронизация создавала новый массив через `normalizeSessions` → React перерисовывал всё дерево → с 20+ сессиями браузер зависал.

**Решение:** `sessionsDigest` — строка-хеш из id, статусов и количества ответов всех сессий. `stableSet` сравнивает дайджест перед вызовом `setLocalSessions` и пропускает обновление, если данные по сути не изменились. Интервал sync увеличен с 900мс до 2000мс.

**Правило:** При любых изменениях в `useStoredSessions` убедиться, что `stableSet` используется вместо прямого `setLocalSessions` (кроме `save`, где дайджест обновляется вручную).

## Потоки данных

### HR создаёт соискателя
`createCandidate` → `createSessionDraft()` (placeholder-сессия с assessmentType 'marketer', без questionIds) → `saveSessionRecord()` → соискатель появляется в списке с вкладкой «Тесты» (пустые результаты)

### HR создаёт комбинированный опрос
Кнопка «+ Создать опрос» → `CreateSurveyModal` → HR выбирает компетенции (чипы) → «Запустить опрос» → `createCombinedSession(group, questionIds, maxSeconds)` → сессия с `assessmentType: 'combined'` и `questionIds` → `ActiveSurveyPanel` показывает QR-код и мониторинг

### Кандидат проходит тест
URL: `#/test/{sessionId}` → `CandidateApp` → `getSessionQuestions(session, sections)` (если есть `questionIds` — берёт конкретные вопросы, иначе — все из раздела) → кандидат отвечает → `saveSessionRecord(updated)` пишет в Firebase

### HR видит прогресс
`ActiveSurveyPanel` → `subscribeRemoteState(sessionsById/{id})` → `setLiveSession` → UI обновляется в реальном времени

### HR видит результаты
`TestsOverview` → `getCompetencyResults(group.sessions, sections)` → чипы компетенций с цветом от зеленого (100%) до красного (0%), сгруппированные по разделам

### Повторное тестирование
`restartSession` → старая сессия `terminated` → новая сессия с новым `id` → `saveSessionRecord` для обеих → QR обновляется

## Компоненты (ключевые)

- **HrApp** — корневой HR-компонент, управляет сессиями, пользователями, вопросами
- **CandidateCard** — карточка соискателя с табами «Тесты» / «Профиль»
- **TestsOverview** — вкладка Тесты: чипы результатов по компетенциям, кнопка «Создать опрос»
- **CreateSurveyModal** — модалка выбора компетенций для нового опроса
- **ActiveSurveyPanel** — QR-код и мониторинг активного опроса (только для сессий с `questionIds`)
- **CandidateApp** — экран кандидата (прохождение теста)
- **QuestionCatalog** — редактор банка вопросов (модалка)

## Цветовая схема
Корпоративный зеленый: `--accent: #1b8d4b`, `--accent-2: #2f9d41`. НЕ менять на синий/голубой.

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

## Версии и откат
- **Тег `v2.0-competency-ui`** — текущая стабильная версия с компетенциями и зеленой схемой. Откат: `git reset --hard v2.0-competency-ui`
