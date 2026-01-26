# 📱 Telegram Deep Links - Обновлено

## Изменения

✅ **Кнопка "Назад"** теперь всегда возвращает на главную страницу  
✅ **Параметр count=0** (или отсутствие параметра) = ВСЕ коллекции для похожих NFT

---

## Формат ссылок для Telegram

```
https://t.me/ваш_бот/app?startapp=ПАРАМЕТРЫ
```

**Параметры разделяются дефисом `-`, пробелы = `_`**

---

## 🔍 Похожие модели (ОБНОВЛЕНО)

**Формат:** `similar-КОЛЛЕКЦИЯ-МОДЕЛЬ-КОЛИЧЕСТВО`

- **Если КОЛИЧЕСТВО не указано или `0`** = поиск по ВСЕМ коллекциям
- **Если указано число** (например `50`) = поиск по указанному количеству

**Примеры:**

```
ВСЕ коллекции (рекомендуется):
https://t.me/bot/app?startapp=similar-Delicious_Cake-Balloons
https://t.me/bot/app?startapp=similar-Delicious_Cake-Balloons-0

50 коллекций:
https://t.me/bot/app?startapp=similar-Blue_Star-Deer-50

100 коллекций:
https://t.me/bot/app?startapp=similar-Green_Star-Tree-100
```

---

## 📖 API

```
https://t.me/bot/app?startapp=api
```

---

## 💎 Донат/Поддержка

```
https://t.me/bot/app?startapp=donate
```

---

## 🎨 Монохромы - Модели по цвету

```
https://t.me/bot/app?startapp=monochrome_color-Delicious_Cake-Amber
https://t.me/bot/app?startapp=monochrome_color-Blue_Star-Aqua
```

---

## 🌈 Монохромы - Фоны для модели

```
https://t.me/bot/app?startapp=monochrome_model-Delicious_Cake-Balloons
https://t.me/bot/app?startapp=monochrome_model-Blue_Star-Deer
```

---

## 📂 Тематики

```
Все тематики:
https://t.me/bot/app?startapp=theme

Тематики для модели:
https://t.me/bot/app?startapp=theme-Delicious_Cake-Balloons

С конкретной тематикой:
https://t.me/bot/app?startapp=theme-Ghost-Spooky-Halloween
```

---

## 🤖 Использование в боте (Python)

```python
from aiogram.types import InlineKeyboardButton, WebAppInfo

BOT_USERNAME = "testwebapps1_bot"
APP_NAME = "app"

def telegram_deeplink(action, *params):
    """Создаёт deep link для Telegram"""
    encoded = [p.replace(' ', '_') for p in params]
    startapp = '-'.join([action] + encoded)
    return f"https://t.me/{BOT_USERNAME}/{APP_NAME}?startapp={startapp}"

# Примеры
keyboard = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(
        text="📖 API",
        web_app=WebAppInfo(url=telegram_deeplink("api"))
    )],
    [InlineKeyboardButton(
        text="🔍 Похожие (ВСЕ коллекции)",
        web_app=WebAppInfo(url=telegram_deeplink("similar", "Delicious Cake", "Balloons"))
    )],
    [InlineKeyboardButton(
        text="🔍 Похожие (50 коллекций)",
        web_app=WebAppInfo(url=telegram_deeplink("similar", "Blue Star", "Deer", "50"))
    )],
    [InlineKeyboardButton(
        text="🎨 Монохромы",
        web_app=WebAppInfo(url=telegram_deeplink("monochrome_color", "Ghost", "Pink"))
    )]
])
```

---

## ✅ Тестовые ссылки

Замените `testwebapps1_bot` на имя вашего бота:

```
API:
https://t.me/testwebapps1_bot/app?startapp=api

Донат:
https://t.me/testwebapps1_bot/app?startapp=donate

Похожие (ВСЕ коллекции):
https://t.me/testwebapps1_bot/app?startapp=similar-Delicious_Cake-Balloons

Похожие (50 коллекций):
https://t.me/testwebapps1_bot/app?startapp=similar-Blue_Star-Deer-50

Монохромы:
https://t.me/testwebapps1_bot/app?startapp=monochrome_color-Blue_Star-Amber

Тематики:
https://t.me/testwebapps1_bot/app?startapp=theme-Ghost-Spooky
```

---

## 🔧 Исправленные проблемы

1. ✅ **Кнопка "Назад"** теперь использует `window.location.replace()` вместо `.href` - главная страница не добавляется в историю
2. ✅ **По умолчанию ВСЕ коллекции** - параметр count по умолчанию `0` вместо `100`

---

**Обновлено:** 26.01.2026  
**Версия:** 2.1
