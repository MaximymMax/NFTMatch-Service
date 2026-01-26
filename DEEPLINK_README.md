# 🚀 Deep Linking System для NFTMatch WebApp

## Что добавлено

Реализована полноценная система deep linking, позволяющая открывать любые страницы и функции WebApp через прямые ссылки из Telegram бота или других источников.

## Изменённые файлы

### `main-page.js`
- ✅ Добавлен роутер для обработки deep links
- ✅ Поддержка 6 типов действий (API, донат, монохромы, похожие, тематики)
- ✅ Индикатор загрузки при обработке ссылки
- ✅ Плавные переходы без перескоков
- ✅ Кнопка "Назад" в Telegram ведёт на главную

## Новые файлы

### `DEEPLINK_GUIDE.md`
📖 **Полная документация** с подробным описанием всех типов ссылок, примерами использования и кодом для Telegram бота.

### `DEEPLINKS_QUICK.md`
⚡ **Краткая шпаргалка** с основными примерами ссылок для быстрого использования.

### `deeplink-test.html`
🧪 **Тестовая страница** с интерактивными примерами всех ссылок и кнопками копирования.

---

## Доступные типы ссылок

### 1. API
```
?action=api
```

### 2. Донат/Поддержка
```
?action=donate
```

### 3. Монохромы - Поиск моделей по цвету
```
?action=monochrome_color&gift=КОЛЛЕКЦИЯ&color=ФОНА
```

### 4. Монохромы - Поиск фонов для модели
```
?action=monochrome_model&gift=КОЛЛЕКЦИЯ&model=МОДЕЛЬ
```

### 5. Похожие модели
```
?action=similar&gift=КОЛЛЕКЦИЯ&model=МОДЕЛЬ&count=КОЛИЧЕСТВО
```

### 6. Тематики
```
?action=theme
?action=theme&gift=КОЛЛЕКЦИЯ&model=МОДЕЛЬ
?action=theme&gift=КОЛЛЕКЦИЯ&model=МОДЕЛЬ&theme=ТЕМАТИКА
```

---

## Примеры рабочих ссылок

Замените `https://ваш-домен` на реальный URL:

```
https://ваш-домен/index.html?action=api
https://ваш-домен/index.html?action=monochrome_color&gift=Delicious%20Cake&color=Amber
https://ваш-домен/index.html?action=similar&gift=Blue%20Star&model=Deer
https://ваш-домен/index.html?action=theme&gift=Green%20Star&model=Tree
```

---

## Как использовать в Telegram боте

### Python (aiogram / python-telegram-bot)

```python
from telegram import InlineKeyboardButton, WebAppInfo

WEBAPP_URL = "https://ваш-домен/index.html"

button = InlineKeyboardButton(
    text="🔍 Похожие",
    web_app=WebAppInfo(
        url=f"{WEBAPP_URL}?action=similar&gift=Delicious%20Cake&model=Balloons"
    )
)
```

### Node.js (node-telegram-bot-api)

```javascript
const button = {
    text: '🔍 Похожие',
    web_app: {
        url: 'https://ваш-домен/index.html?action=similar&gift=Delicious%20Cake&model=Balloons'
    }
};
```

---

## Тестирование

1. **Локально**: Откройте `deeplink-test.html` в браузере
2. **В Telegram**: Создайте кнопку с WebApp URL в боте
3. **Консоль**: Смотрите логи в консоли браузера (F12)

---

## Особенности

✅ **Без перескоков** - прямой переход на целевую страницу  
✅ **Индикатор загрузки** - визуальная обратная связь  
✅ **Кнопка "Назад"** - всегда возвращает на главную  
✅ **Поддержка всех функций** - API, монохромы, похожие, тематики  
✅ **Готово к продакшену** - обработка ошибок, валидация параметров  

---

## Структура проекта

```
NFTMatch_new/
├── main-page.js              # ⭐ С deep linking роутером
├── DEEPLINK_GUIDE.md         # 📖 Полная документация
├── DEEPLINKS_QUICK.md        # ⚡ Краткая шпаргалка
├── deeplink-test.html        # 🧪 Тестовая страница
├── index.html                # Главная страница
└── ...
```

---

## Примечания

- Все названия коллекций/моделей с пробелами должны быть закодированы (`%20`)
- JavaScript автоматически делает это через `encodeURIComponent()`
- Проверьте правильность параметров если ссылка не работает

---

## Поддержка

Для вопросов и предложений: [@YourTelegramChannel](https://t.me/NFTStyler)

---

**Версия:** 1.0  
**Дата:** 26.01.2026  
**Автор:** NFTMatch Team
