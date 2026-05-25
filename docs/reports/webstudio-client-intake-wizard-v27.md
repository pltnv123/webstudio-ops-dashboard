# WebStudio Client Intake Wizard v27

Updated: 2026-05-24T21:26:06Z

Mode: adaptive, one question at a time. The wizard does not dump all questions at once; every answer routes the next best question and package recommendation.

## Questions

### 1. Что продаёте?
- why: Понять категорию бизнеса и язык продукта.
- signals: ниша, тип предложения, B2B/B2C
- next: audience, main_product

### 2. Кому продаёте?
- why: Сформировать сегменты и тон коммуникации.
- signals: ЛПР, возраст/доход, роль, контекст покупки
- next: profitable_clients, pain_points

### 3. Какая главная услуга/продукт?
- why: Выбрать hero-offer и структуру первого экрана.
- signals: основная услуга, маржинальность, частота покупки
- next: avg_check, geo

### 4. География?
- why: Определить локальные доверительные факторы, SEO и юридические формулировки.
- signals: город, район, доставка/онлайн, локальные ограничения
- next: proof, target_action

### 5. Средний чек?
- why: Выбрать стиль продаж: быстрый лид vs премиальная консультация.
- signals: чек, LTV, рассрочка/депозит
- next: profitable_clients, objections

### 6. Какие клиенты самые выгодные?
- why: Сместить сайт к лучшему сегменту, а не ко всем подряд.
- signals: идеальный клиент, нежелательные клиенты, приоритет
- next: pain_points, proof

### 7. Главные боли клиента?
- why: Собрать блоки проблемы/решения и сценарии квиза.
- signals: страхи, потери, триггеры обращения
- next: objections, proof

### 8. Главные возражения?
- why: Подготовить блоки доверия, FAQ и контраргументы.
- signals: дорого, не верю, страшно, долго, не сейчас
- next: proof, forbidden_claims

### 9. Какие доказательства есть?
- why: Не использовать фейковые отзывы/логотипы; строить доверие на реальных артефактах.
- signals: кейсы, фото, сертификаты, цифры, до/после
- next: target_action, style

### 10. Какой целевой action: заявка / звонок / Telegram / оплата / запись?
- why: Настроить CTA, форму и интеграции.
- signals: основной CTA, резервный CTA, скорость ответа
- next: telegram_intake, automation

### 11. Нужен ли Telegram AI-intake?
- why: Определить D2: квалификация лида, авто-вопросы, handoff менеджеру.
- signals: скрипт продаж, оператор, квалификация, уведомления
- next: automation, motion_needed

### 12. Нужна ли автоматизация заявок?
- why: Определить D3: CRM/таблицы/уведомления/статусы.
- signals: куда падают заявки, кто обрабатывает, SLA, статусы
- next: live_integrations, motion_needed

### 13. Нужны ли анимации / видео / motion?
- why: Подключить Motion Factory и HyperFrames-ready план.
- signals: hero video, social teaser, reduced motion, poster
- next: style, references

### 14. Какой стиль нужен: premium / tech / editorial / luxury / bold / minimal?
- why: Выбрать дизайн-направления и motion language.
- signals: визуальный тон, цвет, типографика, ощущение бренда
- next: references, forbidden_claims

### 15. Какие референсы нравятся?
- why: Собрать визуальные ограничения и анти-референсы.
- signals: сайты, бренды, что нравится, что нельзя
- next: forbidden_claims, live_integrations

### 16. Что нельзя обещать?
- why: Соблюсти proof policy и юридическую безопасность.
- signals: медицинские/финансовые claims, гарантии, сертификаты
- next: live_integrations, readiness

### 17. Какие live integrations требуют approval?
- why: Отделить proposal/demo от production writes.
- signals: Telegram, CRM, оплата, аналитика, доступы
- next: readiness

## Safety
- Do not ask for secrets/tokens.
- Live integrations require explicit owner approval.
- Forbidden claims are captured before copywriting.
