import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import {
  BarChart3,
  CheckCircle2,
  ClipboardCopy,
  Clock3,
  LogIn,
  LogOut,
  Plus,
  QrCode,
  ShieldCheck,
  Square,
  StopCircle,
  UserPlus,
} from 'lucide-react'
import './App.css'

type Direction =
  | 'performance'
  | 'analytics'
  | 'brand'
  | 'content'
  | 'crm'
  | 'product'
  | 'research'
  | 'seo'
  | 'smm'
  | 'strategy'

type Competency =
  | 'Стратегия'
  | 'Аналитика'
  | 'Performance'
  | 'Бренд'
  | 'Контент'
  | 'CRM'
  | 'Продуктовый маркетинг'
  | 'Исследования'
  | 'SEO'
  | 'SMM'
  | 'Маркетинговые операции'
  | 'Софтскилы'

type Question = {
  id: string
  text: string
  answers: string[]
  correctIndex: number
  competency: Competency
  direction: Direction | 'soft'
  level: 'junior' | 'middle' | 'senior' | 'lead'
}

type Candidate = {
  fullName: string
  role: string
  contact: string
  note: string
}

type AnswerRecord = {
  questionId: string
  selectedIndex: number
  isCorrect: boolean
  answeredAt: string
  spentSeconds: number
}

type TestSession = {
  id: string
  candidate: Candidate
  createdAt: string
  maxSeconds: number
  status: 'new' | 'in_progress' | 'completed' | 'terminated'
  currentIndex: number
  answers: AnswerRecord[]
  startedAt?: string
  finishedAt?: string
}

type UserAccount = {
  login: string
  password: string
}

type ResultBlock = {
  title: string
  total: number
  correct: number
  percent: number
}

const QUESTION_BANK: Question[] = [
  {
    id: 'demo',
    text: 'Тестовый вопрос: выберите правильный вариант ответа.',
    answers: ['Неправильный', 'Правильный', 'Неправильный', 'Не знаю'],
    correctIndex: 1,
    competency: 'Софтскилы',
    direction: 'soft',
    level: 'junior',
  },
  {
    id: 'mkt-001',
    text: 'Что в маркетинговой стратегии обычно описывает STP?',
    answers: [
      'Сегментацию, выбор целевого сегмента и позиционирование',
      'Скидку, таргетинг и промокод',
      'Сроки, трафик и продажи',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Стратегия',
    direction: 'strategy',
    level: 'junior',
  },
  {
    id: 'mkt-002',
    text: 'Какой показатель лучше всего описывает долю посетителей, совершивших целевое действие?',
    answers: ['CTR', 'Конверсия', 'Охват', 'Не знаю'],
    correctIndex: 1,
    competency: 'Аналитика',
    direction: 'analytics',
    level: 'junior',
  },
  {
    id: 'mkt-003',
    text: 'Что означает CAC?',
    answers: [
      'Средняя выручка с клиента',
      'Стоимость привлечения клиента',
      'Доля органического трафика',
      'Не знаю',
    ],
    correctIndex: 1,
    competency: 'Performance',
    direction: 'performance',
    level: 'junior',
  },
  {
    id: 'mkt-004',
    text: 'Какой ответ лучше всего описывает LTV?',
    answers: [
      'Суммарная ожидаемая ценность клиента за период отношений с компанией',
      'Максимальная ставка в рекламном кабинете',
      'Количество лидов из таргетированной рекламы',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'CRM',
    direction: 'crm',
    level: 'middle',
  },
  {
    id: 'mkt-005',
    text: 'Что показывает CTR в рекламной кампании?',
    answers: [
      'Отношение кликов к показам',
      'Отношение покупок к выручке',
      'Отношение бюджета к прибыли',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Performance',
    direction: 'performance',
    level: 'junior',
  },
  {
    id: 'mkt-006',
    text: 'Для чего в первую очередь нужен UTM-параметр?',
    answers: [
      'Для отслеживания источника и характеристик перехода',
      'Для ускорения загрузки лендинга',
      'Для автоматической защиты от ботов',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Аналитика',
    direction: 'analytics',
    level: 'junior',
  },
  {
    id: 'mkt-007',
    text: 'Что чаще всего является основной целью A/B-теста?',
    answers: [
      'Сравнить варианты и оценить влияние изменения на метрику',
      'Сразу запустить все идеи без риска',
      'Заменить качественные исследования',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Аналитика',
    direction: 'analytics',
    level: 'middle',
  },
  {
    id: 'mkt-008',
    text: 'Что такое статистическая значимость в A/B-тесте?',
    answers: [
      'Гарантия, что вариант будет лучше всегда',
      'Оценка вероятности, что наблюдаемая разница не случайна',
      'Количество участников в фокус-группе',
      'Не знаю',
    ],
    correctIndex: 1,
    competency: 'Аналитика',
    direction: 'analytics',
    level: 'senior',
  },
  {
    id: 'mkt-009',
    text: 'Какой показатель помогает понять окупаемость рекламных расходов?',
    answers: ['ROAS', 'CPM', 'Частота', 'Не знаю'],
    correctIndex: 0,
    competency: 'Performance',
    direction: 'performance',
    level: 'middle',
  },
  {
    id: 'mkt-010',
    text: 'Что означает CPM?',
    answers: [
      'Стоимость тысячи показов',
      'Стоимость одного заказа',
      'Конверсия мобильного приложения',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Performance',
    direction: 'performance',
    level: 'junior',
  },
  {
    id: 'mkt-011',
    text: 'Какой сигнал чаще всего говорит о проблеме посадочной страницы при нормальном качестве трафика?',
    answers: [
      'Высокий CTR и низкая конверсия в заявку',
      'Низкая частота показов',
      'Рост брендового спроса',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Performance',
    direction: 'performance',
    level: 'middle',
  },
  {
    id: 'mkt-012',
    text: 'Что такое инкрементальность в маркетинге?',
    answers: [
      'Общий объем продаж за месяц',
      'Дополнительный результат, который появился именно из-за маркетингового воздействия',
      'Количество креативов в кампании',
      'Не знаю',
    ],
    correctIndex: 1,
    competency: 'Стратегия',
    direction: 'strategy',
    level: 'senior',
  },
  {
    id: 'mkt-013',
    text: 'Что является сутью позиционирования бренда?',
    answers: [
      'Место бренда в восприятии целевой аудитории относительно альтернатив',
      'Размер логотипа в рекламных макетах',
      'Количество публикаций в месяц',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Бренд',
    direction: 'brand',
    level: 'junior',
  },
  {
    id: 'mkt-014',
    text: 'Что лучше всего проверяет сообщение бренда перед масштабной кампанией?',
    answers: [
      'Только личное мнение руководителя',
      'Исследование понимания, релевантности и отличимости сообщения у аудитории',
      'Количество символов в слогане',
      'Не знаю',
    ],
    correctIndex: 1,
    competency: 'Бренд',
    direction: 'brand',
    level: 'middle',
  },
  {
    id: 'mkt-015',
    text: 'Что такое share of voice?',
    answers: [
      'Доля упоминаний или рекламного присутствия бренда среди конкурентов',
      'Громкость аудиоролика',
      'Процент отказов на сайте',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Бренд',
    direction: 'brand',
    level: 'middle',
  },
  {
    id: 'mkt-016',
    text: 'Какая метрика чаще всего относится к знанию бренда?',
    answers: ['Brand awareness', 'CPA', 'Churn rate', 'Не знаю'],
    correctIndex: 0,
    competency: 'Бренд',
    direction: 'brand',
    level: 'junior',
  },
  {
    id: 'mkt-017',
    text: 'Что такое tone of voice бренда?',
    answers: [
      'Единый характер и манера коммуникации бренда',
      'Только юридическое название компании',
      'Средняя частота рассылок',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Контент',
    direction: 'content',
    level: 'junior',
  },
  {
    id: 'mkt-018',
    text: 'Какой элемент контент-стратегии нужен для регулярного управления публикациями?',
    answers: ['Контент-план', 'Платежный календарь', 'Складской отчет', 'Не знаю'],
    correctIndex: 0,
    competency: 'Контент',
    direction: 'content',
    level: 'junior',
  },
  {
    id: 'mkt-019',
    text: 'Какой подход помогает создать контент для разных стадий воронки?',
    answers: [
      'Сопоставить темы с потребностями аудитории на этапах осведомленности, выбора и покупки',
      'Публиковать одинаковые посты во всех каналах',
      'Ориентироваться только на длину текста',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Контент',
    direction: 'content',
    level: 'middle',
  },
  {
    id: 'mkt-020',
    text: 'Что лучше всего показывает эффективность статьи в привлечении лидов?',
    answers: [
      'Количество целевых заявок или регистраций после чтения',
      'Наличие красивой обложки',
      'Число слов в первом абзаце',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Контент',
    direction: 'content',
    level: 'middle',
  },
  {
    id: 'mkt-021',
    text: 'Что такое сегментация базы в CRM-маркетинге?',
    answers: [
      'Разделение аудитории на группы по признакам и поведению для более точной коммуникации',
      'Удаление всех неактивных клиентов без анализа',
      'Случайная отправка разных писем',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'CRM',
    direction: 'crm',
    level: 'junior',
  },
  {
    id: 'mkt-022',
    text: 'Какой сценарий относится к триггерным коммуникациям?',
    answers: [
      'Письмо о брошенной корзине после конкретного действия пользователя',
      'Единый пресс-релиз всем подряд',
      'Баннер на фасаде магазина',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'CRM',
    direction: 'crm',
    level: 'junior',
  },
  {
    id: 'mkt-023',
    text: 'Что такое churn rate?',
    answers: [
      'Доля клиентов, которые прекратили пользоваться продуктом за период',
      'Количество новых показов рекламы',
      'Скорость загрузки письма',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'CRM',
    direction: 'crm',
    level: 'middle',
  },
  {
    id: 'mkt-024',
    text: 'Какой подход обычно повышает качество персонализации?',
    answers: [
      'Использование данных о поведении, интересах и жизненном цикле клиента',
      'Отправка одного предложения всей базе',
      'Увеличение размера логотипа в письме',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'CRM',
    direction: 'crm',
    level: 'senior',
  },
  {
    id: 'mkt-025',
    text: 'Что описывает ICP в B2B-маркетинге?',
    answers: [
      'Профиль идеального клиента',
      'Индекс кликабельности публикации',
      'Шаблон счета на оплату',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Продуктовый маркетинг',
    direction: 'product',
    level: 'middle',
  },
  {
    id: 'mkt-026',
    text: 'Что такое value proposition?',
    answers: [
      'Ясное обещание ценности для целевого клиента',
      'Список всех функций продукта без приоритета',
      'Размер скидки на первый заказ',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Продуктовый маркетинг',
    direction: 'product',
    level: 'junior',
  },
  {
    id: 'mkt-027',
    text: 'Что должен содержать go-to-market план?',
    answers: [
      'Целевые сегменты, позиционирование, каналы, цели, запуск и метрики',
      'Только список публикаций в соцсетях',
      'Только медиабюджет без гипотез',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Продуктовый маркетинг',
    direction: 'product',
    level: 'senior',
  },
  {
    id: 'mkt-028',
    text: 'Когда продуктовый маркетолог обычно использует battlecard?',
    answers: [
      'Чтобы помочь продажам сравнивать продукт с конкурентами',
      'Чтобы выбрать цвет кнопки на сайте',
      'Чтобы заменить договор с клиентом',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Продуктовый маркетинг',
    direction: 'product',
    level: 'middle',
  },
  {
    id: 'mkt-029',
    text: 'Какой метод лучше подходит для понимания мотивов и барьеров аудитории?',
    answers: [
      'Глубинные интервью',
      'Только просмотр общего охвата',
      'Случайный выбор рекламной ставки',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Исследования',
    direction: 'research',
    level: 'junior',
  },
  {
    id: 'mkt-030',
    text: 'Что такое репрезентативная выборка?',
    answers: [
      'Выборка, структура которой отражает важные характеристики изучаемой аудитории',
      'Любые первые десять ответов',
      'Список самых лояльных клиентов',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Исследования',
    direction: 'research',
    level: 'middle',
  },
  {
    id: 'mkt-031',
    text: 'Какой вопрос в анкете считается наводящим?',
    answers: [
      'Тот, который подталкивает респондента к определенному ответу',
      'Любой вопрос с вариантами ответа',
      'Вопрос без изображения',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Исследования',
    direction: 'research',
    level: 'middle',
  },
  {
    id: 'mkt-032',
    text: 'Что такое JTBD?',
    answers: [
      'Подход к описанию задач и прогресса, ради которых человек выбирает продукт',
      'Тип скидки для повторной покупки',
      'Формат баннера для медийной рекламы',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Исследования',
    direction: 'research',
    level: 'senior',
  },
  {
    id: 'mkt-033',
    text: 'Что является частью технической SEO-оптимизации?',
    answers: [
      'Индексация, скорость загрузки, корректные редиректы и структура сайта',
      'Только выбор модели оплаты рекламы',
      'Только публикация пресс-релиза',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SEO',
    direction: 'seo',
    level: 'middle',
  },
  {
    id: 'mkt-034',
    text: 'Что такое поисковый интент?',
    answers: [
      'Намерение пользователя, стоящее за поисковым запросом',
      'Частота публикаций в рассылке',
      'Время ответа менеджера',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SEO',
    direction: 'seo',
    level: 'junior',
  },
  {
    id: 'mkt-035',
    text: 'Что такое canonical URL?',
    answers: [
      'Указание основной версии страницы среди похожих или дублирующихся',
      'Любая ссылка из рекламного объявления',
      'Адрес личного кабинета маркетолога',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SEO',
    direction: 'seo',
    level: 'senior',
  },
  {
    id: 'mkt-036',
    text: 'Для чего используется семантическое ядро?',
    answers: [
      'Для группировки поисковых запросов и планирования структуры/контента',
      'Для расчета зарплаты команды',
      'Для выбора формата договора',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SEO',
    direction: 'seo',
    level: 'junior',
  },
  {
    id: 'mkt-037',
    text: 'Что лучше всего отражает вовлеченность аудитории в SMM?',
    answers: [
      'Доля реакций, комментариев, сохранений и переходов относительно охвата или подписчиков',
      'Только количество постов',
      'Только размер аватара',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SMM',
    direction: 'smm',
    level: 'junior',
  },
  {
    id: 'mkt-038',
    text: 'Что важно проверить перед запуском сотрудничества с блогером?',
    answers: [
      'Соответствие аудитории, качество вовлеченности, репутацию и условия интеграции',
      'Только красивую обложку профиля',
      'Только количество букв в никнейме',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SMM',
    direction: 'smm',
    level: 'middle',
  },
  {
    id: 'mkt-039',
    text: 'Что такое контентная рубрика?',
    answers: [
      'Повторяющийся тематический формат публикаций',
      'Платежный документ подрядчика',
      'Технический тег сайта',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SMM',
    direction: 'smm',
    level: 'junior',
  },
  {
    id: 'mkt-040',
    text: 'Какой подход снижает риск репутационного кризиса в соцсетях?',
    answers: [
      'Заранее прописанные сценарии реакции, роли и правила эскалации',
      'Удаление всех комментариев без анализа',
      'Полный отказ от мониторинга',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'SMM',
    direction: 'smm',
    level: 'senior',
  },
  {
    id: 'mkt-041',
    text: 'Что такое маркетинговая воронка?',
    answers: [
      'Модель пути аудитории от первого контакта до целевого действия и удержания',
      'Список всех сотрудников отдела',
      'Формат бухгалтерского отчета',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Стратегия',
    direction: 'strategy',
    level: 'junior',
  },
  {
    id: 'mkt-042',
    text: 'Что означает North Star Metric?',
    answers: [
      'Ключевая метрика, отражающая создаваемую продуктом ценность и рост',
      'Самая дорогая рекламная кампания',
      'Первый показатель в таблице бюджета',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Стратегия',
    direction: 'strategy',
    level: 'senior',
  },
  {
    id: 'mkt-043',
    text: 'Что в медиаплане обязательно связывает активность с бизнес-целью?',
    answers: [
      'Целевые метрики, бюджет, канал, период и ожидаемый результат',
      'Только список праздников',
      'Только названия конкурентов',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Маркетинговые операции',
    direction: 'strategy',
    level: 'middle',
  },
  {
    id: 'mkt-044',
    text: 'Что помогает управлять маркетинговым бюджетом в течение периода?',
    answers: [
      'План-факт анализ расходов и результата',
      'Смена названия кампаний каждый день',
      'Отключение всей аналитики',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Маркетинговые операции',
    direction: 'analytics',
    level: 'middle',
  },
  {
    id: 'mkt-045',
    text: 'Что должен сделать маркетолог, если данные противоречат его гипотезе?',
    answers: [
      'Проверить качество данных и пересмотреть гипотезу при подтверждении результата',
      'Скрыть данные из отчета',
      'Оставить гипотезу неизменной без проверки',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Софтскилы',
    direction: 'soft',
    level: 'middle',
  },
  {
    id: 'mkt-046',
    text: 'Как лучше действовать при конфликте ожиданий между продажами и маркетингом?',
    answers: [
      'Согласовать общие цели, определения лидов, SLA и прозрачные метрики',
      'Игнорировать обратную связь продаж',
      'Запретить обсуждать качество лидов',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Софтскилы',
    direction: 'soft',
    level: 'senior',
  },
  {
    id: 'mkt-047',
    text: 'Что является сильным признаком профессиональной этики маркетолога?',
    answers: [
      'Честная работа с данными, согласиями и ожиданиями аудитории',
      'Искажение результатов ради красивого отчета',
      'Сбор любых данных без разрешения',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Софтскилы',
    direction: 'soft',
    level: 'junior',
  },
  {
    id: 'mkt-048',
    text: 'Какой принцип лучше подходит для приоритизации маркетинговых гипотез?',
    answers: [
      'Оценить потенциальный эффект, уверенность, трудозатраты и риски',
      'Выбрать самую новую идею',
      'Запустить только то, что проще описать в презентации',
      'Не знаю',
    ],
    correctIndex: 0,
    competency: 'Софтскилы',
    direction: 'soft',
    level: 'middle',
  },
]

const DIRECTION_LABELS: Record<Direction, string> = {
  performance: 'Performance-маркетинг',
  analytics: 'Аналитика',
  brand: 'Бренд',
  content: 'Контент',
  crm: 'CRM',
  product: 'Продуктовый маркетинг',
  research: 'Исследования',
  seo: 'SEO',
  smm: 'SMM',
  strategy: 'Стратегия',
}

const STORAGE_SESSIONS = 'marketer-assessment:sessions'
const STORAGE_USERS = 'marketer-assessment:users'
const STORAGE_ACTIVE_USER = 'marketer-assessment:active-user'

const createId = () =>
  `mk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJson = <T,>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new Event('assessment-storage'))
}

const getSessions = () => readJson<TestSession[]>(STORAGE_SESSIONS, [])
const setSessions = (sessions: TestSession[]) => writeJson(STORAGE_SESSIONS, sessions)
const getUsers = () => readJson<UserAccount[]>(STORAGE_USERS, [])
const getActiveUser = () => localStorage.getItem(STORAGE_ACTIVE_USER)

const getRoute = () => {
  const hash = window.location.hash.replace(/^#\/?/, '')
  const [name, id] = hash.split('/')
  return { name: name || 'hr', id }
}

const getQuestion = (id: string) => QUESTION_BANK.find((question) => question.id === id)
const scoredQuestions = QUESTION_BANK.filter((question) => question.id !== 'demo')

function useStoredSessions() {
  const [sessions, setLocalSessions] = useState<TestSession[]>(() => getSessions())

  useEffect(() => {
    const sync = () => setLocalSessions(getSessions())
    window.addEventListener('storage', sync)
    window.addEventListener('assessment-storage', sync)
    const timer = window.setInterval(sync, 900)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('assessment-storage', sync)
      window.clearInterval(timer)
    }
  }, [])

  const save = (next: TestSession[]) => {
    setLocalSessions(next)
    setSessions(next)
  }

  return [sessions, save] as const
}

function calculateResults(session: TestSession) {
  const answerMap = new Map(session.answers.map((answer) => [answer.questionId, answer]))
  const scoredAnswers = scoredQuestions.map((question) => ({
    question,
    answer: answerMap.get(question.id),
  }))
  const correct = scoredAnswers.filter((item) => item.answer?.isCorrect).length
  const percent = Math.round((correct / scoredQuestions.length) * 100)
  const seniorCorrect = scoredAnswers.filter(
    (item) => item.question.level === 'senior' && item.answer?.isCorrect,
  ).length
  const leadCorrect = scoredAnswers.filter(
    (item) => item.question.level === 'lead' && item.answer?.isCorrect,
  ).length

  const grade =
    percent >= 86 && seniorCorrect >= 8
      ? 'Lead / Head-ready'
      : percent >= 72 && seniorCorrect >= 5
        ? 'Senior'
        : percent >= 50
          ? 'Middle'
          : percent >= 30
            ? 'Junior'
            : 'Начальный уровень'

  const competencyBlocks = buildBlocks(
    [...new Set(scoredQuestions.map((question) => question.competency))],
    (question) => question.competency,
    answerMap,
  )

  const directionBlocks = buildBlocks(
    Object.keys(DIRECTION_LABELS) as Direction[],
    (question) => question.direction,
    answerMap,
    DIRECTION_LABELS,
  )

  const softBlocks = buildBlocks(['Софтскилы'], (question) => question.competency, answerMap)
  const specialization = [...directionBlocks]
    .filter((block) => block.total > 0)
    .sort((a, b) => b.percent - a.percent || b.correct - a.correct)[0]

  return {
    correct,
    total: scoredQuestions.length,
    percent,
    grade,
    seniorCorrect,
    leadCorrect,
    specialization:
      specialization && specialization.percent >= 55
        ? specialization.title
        : 'Универсальный маркетинг',
    competencyBlocks,
    directionBlocks,
    softBlocks,
  }
}

function buildBlocks<T extends string>(
  keys: T[],
  picker: (question: Question) => string,
  answerMap: Map<string, AnswerRecord>,
  labels?: Record<string, string>,
): ResultBlock[] {
  return keys.map((key) => {
    const questions = scoredQuestions.filter((question) => picker(question) === key)
    const correct = questions.filter((question) => answerMap.get(question.id)?.isCorrect).length
    return {
      title: labels?.[key] ?? key,
      total: questions.length,
      correct,
      percent: questions.length ? Math.round((correct / questions.length) * 100) : 0,
    }
  })
}

function App() {
  const [route, setRoute] = useState(getRoute())

  useEffect(() => {
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  if (route.name === 'test' && route.id) {
    return <CandidateApp sessionId={route.id} />
  }

  return <HrApp />
}

function HrApp() {
  const [sessions, saveSessions] = useStoredSessions()
  const [activeLogin, setActiveLogin] = useState(getActiveUser())
  const [authMode, setAuthMode] = useState<'start' | 'login' | 'register'>('start')
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id ?? null)
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0]

  useEffect(() => {
    if (!selectedId && sessions[0]) {
      window.setTimeout(() => setSelectedId(sessions[0].id), 0)
    }
  }, [selectedId, sessions])

  const createSession = (candidate: Candidate, maxSeconds: number) => {
    const session: TestSession = {
      id: createId(),
      candidate,
      createdAt: new Date().toISOString(),
      maxSeconds,
      status: 'new',
      currentIndex: 0,
      answers: [],
    }
    saveSessions([session, ...sessions])
    setSelectedId(session.id)
  }

  const finishSession = (id: string) => {
    saveSessions(
      sessions.map((session) =>
        session.id === id
          ? {
              ...session,
              status: 'terminated',
              finishedAt: new Date().toISOString(),
            }
          : session,
      ),
    )
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_ACTIVE_USER)
    setActiveLogin(null)
    setAuthMode('start')
  }

  if (!activeLogin) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <div className="brand-mark">
            <ShieldCheck size={28} />
          </div>
          <h1>Оценка компетенций маркетолога</h1>
          <p>Сервис для HR: ссылки, QR-коды, таймер, мониторинг прохождения и итоговая оценка.</p>
          {authMode === 'start' ? (
            <div className="auth-actions">
              <button className="primary" type="button" onClick={() => setAuthMode('register')}>
                <UserPlus size={18} />
                Зарегистрироваться
              </button>
              <button className="secondary" type="button" onClick={() => setAuthMode('login')}>
                <LogIn size={18} />
                Войти
              </button>
            </div>
          ) : (
            <AuthForm
              mode={authMode}
              onBack={() => setAuthMode('start')}
              onSuccess={(login) => {
                localStorage.setItem(STORAGE_ACTIVE_USER, login)
                setActiveLogin(login)
              }}
            />
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">HR-кабинет</span>
          <h1>Оценка маркетолога</h1>
        </div>
        <button className="icon-button" type="button" title="Выйти" onClick={logout}>
          <LogOut size={20} />
        </button>
      </header>

      <section className="dashboard-grid">
        <CreateSessionForm onCreate={createSession} />
        <SessionList sessions={sessions} selectedId={selected?.id} onSelect={setSelectedId} />
      </section>

      {selected ? (
        <SessionDetails session={selected} onFinish={finishSession} />
      ) : (
        <section className="empty-state">
          <QrCode size={32} />
          <h2>Создайте первую ссылку</h2>
          <p>После создания анкеты здесь появятся QR-код, статус и ответы кандидата.</p>
        </section>
      )}

      <QuestionCatalog />
    </main>
  )
}

function AuthForm({
  mode,
  onBack,
  onSuccess,
}: {
  mode: 'login' | 'register'
  onBack: () => void
  onSuccess: (login: string) => void
}) {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const users = getUsers()
    const normalized = login.trim()
    if (!normalized || !password) {
      setError('Введите логин и пароль.')
      return
    }
    if (mode === 'register') {
      if (password !== repeat) {
        setError('Пароли не совпадают.')
        return
      }
      if (users.some((user) => user.login === normalized)) {
        setError('Такой логин уже зарегистрирован.')
        return
      }
      writeJson(STORAGE_USERS, [...users, { login: normalized, password }])
      onSuccess(normalized)
      return
    }
    const found = users.find((user) => user.login === normalized && user.password === password)
    if (!found) {
      setError('Неверный логин или пароль.')
      return
    }
    onSuccess(normalized)
  }

  return (
    <form className="stack-form" onSubmit={submit}>
      <label>
        Логин
        <input value={login} onChange={(event) => setLogin(event.target.value)} />
      </label>
      <label>
        Пароль
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {mode === 'register' && (
        <label>
          Повторите пароль
          <input
            type="password"
            value={repeat}
            onChange={(event) => setRepeat(event.target.value)}
          />
        </label>
      )}
      {error && <p className="error-text">{error}</p>}
      <button className="primary" type="submit">
        {mode === 'register' ? 'Создать аккаунт' : 'Войти'}
      </button>
      <button className="ghost" type="button" onClick={onBack}>
        Назад
      </button>
    </form>
  )
}

function CreateSessionForm({
  onCreate,
}: {
  onCreate: (candidate: Candidate, maxSeconds: number) => void
}) {
  const [candidate, setCandidate] = useState<Candidate>({
    fullName: '',
    role: '',
    contact: '',
    note: '',
  })
  const [maxSeconds, setMaxSeconds] = useState(45)
  const [error, setError] = useState('')

  const update = (field: keyof Candidate, value: string) =>
    setCandidate((current) => ({ ...current, [field]: value }))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!candidate.fullName.trim()) {
      setError('Укажите ФИО соискателя.')
      return
    }
    onCreate(
      {
        fullName: candidate.fullName.trim(),
        role: candidate.role.trim(),
        contact: candidate.contact.trim(),
        note: candidate.note.trim(),
      },
      Math.max(10, Math.min(180, maxSeconds)),
    )
    setCandidate({ fullName: '', role: '', contact: '', note: '' })
    setMaxSeconds(45)
    setError('')
  }

  return (
    <section className="panel">
      <div className="section-title">
        <Plus size={20} />
        <h2>Новый соискатель</h2>
      </div>
      <form className="stack-form" onSubmit={submit}>
        <label>
          ФИО
          <input
            placeholder="Например, Анна Петрова"
            value={candidate.fullName}
            onChange={(event) => update('fullName', event.target.value)}
          />
        </label>
        <label>
          Позиция
          <input
            placeholder="Маркетолог, performance-специалист"
            value={candidate.role}
            onChange={(event) => update('role', event.target.value)}
          />
        </label>
        <label>
          Контакт
          <input
            placeholder="Телефон, почта или мессенджер"
            value={candidate.contact}
            onChange={(event) => update('contact', event.target.value)}
          />
        </label>
        <label>
          Заметка HR
          <textarea
            rows={3}
            placeholder="Опыт, источник кандидата, комментарий"
            value={candidate.note}
            onChange={(event) => update('note', event.target.value)}
          />
        </label>
        <label>
          Время на вопрос, секунд
          <input
            type="number"
            min={10}
            max={180}
            value={maxSeconds}
            onChange={(event) => setMaxSeconds(Number(event.target.value))}
          />
        </label>
        {error && <p className="error-text">{error}</p>}
        <button className="primary" type="submit">
          <QrCode size={18} />
          Сформировать ссылку
        </button>
      </form>
    </section>
  )
}

function SessionList({
  sessions,
  selectedId,
  onSelect,
}: {
  sessions: TestSession[]
  selectedId?: string
  onSelect: (id: string) => void
}) {
  return (
    <section className="panel">
      <div className="section-title">
        <Clock3 size={20} />
        <h2>Прохождения</h2>
      </div>
      <div className="session-list">
        {sessions.map((session) => (
          <button
            className={`session-row ${session.id === selectedId ? 'active' : ''}`}
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
          >
            <span>{session.candidate.fullName}</span>
            <small>{statusLabel(session.status)}</small>
          </button>
        ))}
        {!sessions.length && <p className="muted">Пока нет созданных ссылок.</p>}
      </div>
    </section>
  )
}

function SessionDetails({
  session,
  onFinish,
}: {
  session: TestSession
  onFinish: (id: string) => void
}) {
  const [qr, setQr] = useState('')
  const url = useMemo(() => {
    const base = `${window.location.origin}${window.location.pathname}`
    return `${base}#/test/${session.id}`
  }, [session.id])
  const result = calculateResults(session)
  const currentQuestion = QUESTION_BANK[session.currentIndex]
  const canFinish = session.status === 'new' || session.status === 'in_progress'

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 220 }).then(setQr)
  }, [url])

  const copy = async () => {
    await navigator.clipboard?.writeText(url)
  }

  return (
    <section className="details-layout">
      <div className="panel link-panel">
        <div className="section-title">
          <QrCode size={20} />
          <h2>Ссылка кандидата</h2>
        </div>
        {qr && <img className="qr" src={qr} alt="QR-код для прохождения теста" />}
        <div className="copy-row">
          <input readOnly value={url} />
          <button className="icon-button" type="button" title="Скопировать" onClick={copy}>
            <ClipboardCopy size={19} />
          </button>
        </div>
        <dl className="meta-grid">
          <div>
            <dt>ФИО</dt>
            <dd>{session.candidate.fullName}</dd>
          </div>
          <div>
            <dt>Статус</dt>
            <dd>{statusLabel(session.status)}</dd>
          </div>
          <div>
            <dt>Таймер</dt>
            <dd>{session.maxSeconds} сек.</dd>
          </div>
          <div>
            <dt>Ответы</dt>
            <dd>
              {session.answers.length}/{QUESTION_BANK.length}
            </dd>
          </div>
        </dl>
        {canFinish && (
          <button className="danger" type="button" onClick={() => onFinish(session.id)}>
            <StopCircle size={18} />
            Завершить тестирование
          </button>
        )}
      </div>

      <div className="panel monitor-panel">
        <div className="section-title">
          <BarChart3 size={20} />
          <h2>Мониторинг</h2>
        </div>
        <div className="current-question">
          <span className="eyebrow">Текущий вопрос</span>
          <strong>
            {session.status === 'completed' || session.status === 'terminated'
              ? 'Тестирование завершено'
              : currentQuestion?.text ?? 'Кандидат еще не начал'}
          </strong>
        </div>
        <div className="answer-log">
          {session.answers.map((answer, index) => {
            const question = getQuestion(answer.questionId)
            return (
              <article className="answer-item" key={`${answer.questionId}-${index}`}>
                <div>
                  <strong>{question?.text}</strong>
                  <p>{question?.answers[answer.selectedIndex]}</p>
                </div>
                <span className={answer.isCorrect ? 'pill ok' : 'pill bad'}>
                  {answer.isCorrect ? 'Верно' : 'Неверно'}
                </span>
              </article>
            )
          })}
          {!session.answers.length && <p className="muted">Ответы появятся здесь в реальном времени.</p>}
        </div>
      </div>

      {(session.status === 'completed' || session.status === 'terminated') && (
        <ResultsPanel result={result} title="Итоговая оценка HR" />
      )}
    </section>
  )
}

function QuestionCatalog() {
  return (
    <section className="panel catalog-panel">
      <div className="section-title">
        <Square size={19} />
        <h2>Банк вопросов</h2>
      </div>
      <p className="muted">
        {QUESTION_BANK.length} вопросов, включая первый тестовый. Редактирование закрыто, логика
        оценки зашита в сервисе.
      </p>
      <div className="question-list">
        {QUESTION_BANK.map((question, index) => (
          <details key={question.id}>
            <summary>
              <span>{index + 1}. {question.text}</span>
              <small>{question.competency}</small>
            </summary>
            <ol>
              {question.answers.map((answer, answerIndex) => (
                <li
                  className={answerIndex === question.correctIndex ? 'correct-answer' : ''}
                  key={`${question.id}-${answerIndex}`}
                >
                  {answer}
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </section>
  )
}

function CandidateApp({ sessionId }: { sessionId: string }) {
  const [sessions, saveSessions] = useStoredSessions()
  const session = sessions.find((item) => item.id === sessionId)
  const [secondsLeft, setSecondsLeft] = useState(session?.maxSeconds ?? 45)
  const [questionStartedAt, setQuestionStartedAt] = useState(Date.now())
  const [savedFlash, setSavedFlash] = useState(false)

  const currentQuestion = session ? QUESTION_BANK[session.currentIndex] : undefined
  const finished = session?.status === 'completed'
  const terminated = session?.status === 'terminated'

  useEffect(() => {
    if (!session || session.status !== 'in_progress') return
    const resetTimer = window.setTimeout(() => {
      setSecondsLeft(session.maxSeconds)
      setQuestionStartedAt(Date.now())
    }, 0)
    return () => window.clearTimeout(resetTimer)
  }, [session])

  useEffect(() => {
    if (!session || session.status !== 'in_progress' || !currentQuestion) return
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          submitAnswer(currentQuestion.answers.length - 1)
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  })

  if (!session) {
    return (
      <main className="candidate-shell centered">
        <h1>Ссылка не найдена</h1>
        <p>Попросите HR сформировать новую ссылку для прохождения.</p>
      </main>
    )
  }

  const updateSession = (updater: (session: TestSession) => TestSession) => {
    saveSessions(sessions.map((item) => (item.id === session.id ? updater(item) : item)))
  }

  const start = () => {
    updateSession((current) => ({
      ...current,
      status: 'in_progress',
      startedAt: current.startedAt ?? new Date().toISOString(),
      currentIndex: 0,
    }))
  }

  function submitAnswer(selectedIndex: number) {
    if (!session || !currentQuestion || session.status !== 'in_progress') return
    const spentSeconds = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000))
    const isCorrect = selectedIndex === currentQuestion.correctIndex
    const nextIndex = session.currentIndex + 1
    updateSession((current) => ({
      ...current,
      answers: [
        ...current.answers,
        {
          questionId: currentQuestion.id,
          selectedIndex,
          isCorrect,
          answeredAt: new Date().toISOString(),
          spentSeconds,
        },
      ],
      currentIndex: Math.min(nextIndex, QUESTION_BANK.length - 1),
      status: nextIndex >= QUESTION_BANK.length ? 'completed' : 'in_progress',
      finishedAt: nextIndex >= QUESTION_BANK.length ? new Date().toISOString() : current.finishedAt,
    }))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 450)
  }

  if (terminated) {
    return (
      <main className="candidate-shell centered">
        <CheckCircle2 size={42} />
        <h1>Спасибо за прохождение тестирования</h1>
      </main>
    )
  }

  if (finished) {
    return (
      <main className="candidate-shell">
        <ResultsPanel result={calculateResults(session)} title="Ваш результат" />
      </main>
    )
  }

  if (session.status === 'new') {
    return (
      <main className="candidate-shell centered">
        <span className="eyebrow">Оценка компетенций</span>
        <h1>{session.candidate.fullName}</h1>
        <p>Ответ выбирается одним касанием. Первый вопрос тестовый и нужен только для знакомства с интерфейсом.</p>
        <button className="primary wide" type="button" onClick={start}>
          Начать
        </button>
      </main>
    )
  }

  return (
    <main className="candidate-shell">
      <section className="question-screen">
        <div className="question-progress">
          <span>
            Вопрос {session.currentIndex + 1} из {QUESTION_BANK.length}
          </span>
          <strong>{secondsLeft} сек.</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${((session.currentIndex + 1) / QUESTION_BANK.length) * 100}%` }} />
        </div>
        <h1>{currentQuestion?.text}</h1>
        <div className="answer-options">
          {currentQuestion?.answers.map((answer, index) => (
            <button type="button" key={`${currentQuestion.id}-${index}`} onClick={() => submitAnswer(index)}>
              {answer}
            </button>
          ))}
        </div>
        <p className={`saved-indicator ${savedFlash ? 'visible' : ''}`}>Ответ сохранен</p>
      </section>
    </main>
  )
}

function ResultsPanel({ result, title }: { result: ReturnType<typeof calculateResults>; title: string }) {
  return (
    <section className="panel results-panel">
      <div className="section-title">
        <CheckCircle2 size={20} />
        <h2>{title}</h2>
      </div>
      <div className="score-hero">
        <span>{result.percent}%</span>
        <div>
          <strong>{result.grade}</strong>
          <p>Рекомендуемая специализация: {result.specialization}</p>
        </div>
      </div>
      <div className="result-blocks">
        <ResultGroup title="Компетенции" blocks={result.competencyBlocks} />
        <ResultGroup title="Направления маркетинга" blocks={result.directionBlocks} />
        <ResultGroup title="Софтскилы" blocks={result.softBlocks} />
      </div>
    </section>
  )
}

function ResultGroup({ title, blocks }: { title: string; blocks: ResultBlock[] }) {
  return (
    <div className="result-group">
      <h3>{title}</h3>
      {blocks
        .filter((block) => block.total > 0)
        .map((block) => (
          <div className="metric-row" key={block.title}>
            <span>{block.title}</span>
            <div className="mini-bar" aria-hidden="true">
              <span style={{ width: `${block.percent}%` }} />
            </div>
            <strong>
              {block.correct}/{block.total}
            </strong>
          </div>
        ))}
    </div>
  )
}

function statusLabel(status: TestSession['status']) {
  const labels: Record<TestSession['status'], string> = {
    new: 'Ожидает старта',
    in_progress: 'В процессе',
    completed: 'Завершено',
    terminated: 'Остановлено HR',
  }
  return labels[status]
}

export default App
