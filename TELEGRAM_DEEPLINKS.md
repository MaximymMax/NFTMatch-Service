# 📱 Telegram Deep Links - Примеры

## Формат ссылок для Telegram

Для Telegram Mini Apps используется специальный формат с параметром `startapp`:

```
https://t.me/ваш_бот/app?startapp=ПАРАМЕТРЫ
```

---

## 🔧 Формат параметров

Параметры разделяются дефисом `-`, пробелы заменяются на подчеркивание `_`:

**Формат:** `action-param1-param2-param3`

---

## 📖 API

```
https://t.me/testwebapps1_bot/app?startapp=api
```

---

## 💎 Донат/Поддержка

```
https://t.me/testwebapps1_bot/app?startapp=donate
```

или

```
https://t.me/testwebapps1_bot/app?startapp=support
```

---

## 🎨 Монохромы - Модели по цвету

**Формат:** `monochrome_color-КОЛЛЕКЦИЯ-ЦВЕТ`

**Примеры:**

```
Delicious Cake на Amber:
https://t.me/testwebapps1_bot/app?startapp=monochrome_color-Delicious_Cake-Amber

Blue Star на Aqua:
https://t.me/testwebapps1_bot/app?startapp=monochrome_color-Blue_Star-Aqua

Green Star на Green:
https://t.me/testwebapps1_bot/app?startapp=monochrome_color-Green_Star-Green

Ghost на Pink:
https://t.me/testwebapps1_bot/app?startapp=monochrome_color-Ghost-Pink
```

---

## 🌈 Монохромы - Фоны для модели

**Формат:** `monochrome_model-КОЛЛЕКЦИЯ-МОДЕЛЬ`

**Примеры:**

```
Delicious Cake - Balloons:
https://t.me/testwebapps1_bot/app?startapp=monochrome_model-Delicious_Cake-Balloons

Blue Star - Deer:
https://t.me/testwebapps1_bot/app?startapp=monochrome_model-Blue_Star-Deer

Green Star - Tree:
https://t.me/testwebapps1_bot/app?startapp=monochrome_model-Green_Star-Tree

Ghost - Spooky:
https://t.me/testwebapps1_bot/app?startapp=monochrome_model-Ghost-Spooky
```

---

## 🔍 Похожие модели

**Формат:** `similar-КОЛЛЕКЦИЯ-МОДЕЛЬ` или `similar-КОЛЛЕКЦИЯ-МОДЕЛЬ-КОЛИЧЕСТВО`

**Примеры:**

```
Delicious Cake - Balloons:
https://t.me/testwebapps1_bot/app?startapp=similar-Delicious_Cake-Balloons

Blue Star - Deer (50 коллекций):
https://t.me/testwebapps1_bot/app?startapp=similar-Blue_Star-Deer-50

Green Star - Tree (100 коллекций):
https://t.me/testwebapps1_bot/app?startapp=similar-Green_Star-Tree-100

Ghost - Spooky:
https://t.me/testwebapps1_bot/app?startapp=similar-Ghost-Spooky
```

---

## 📂 Тематики

**Формат:** `theme` или `theme-КОЛЛЕКЦИЯ-МОДЕЛЬ` или `theme-КОЛЛЕКЦИЯ-МОДЕЛЬ-ТЕМАТИКА`

**Примеры:**

```
Просто открыть тематики:
https://t.me/testwebapps1_bot/app?startapp=theme

Delicious Cake - Balloons:
https://t.me/testwebapps1_bot/app?startapp=theme-Delicious_Cake-Balloons

Blue Star - Deer:
https://t.me/testwebapps1_bot/app?startapp=theme-Blue_Star-Deer

Ghost - Spooky (тематика Halloween):
https://t.me/testwebapps1_bot/app?startapp=theme-Ghost-Spooky-Halloween
```

---

## 🤖 Использование в боте (Python)

### aiogram 3.x

```python
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

BOT_USERNAME = "testwebapps1_bot"
APP_NAME = "app"

def create_telegram_deeplink(action, *params):
    """Создаёт deep link для Telegram WebApp"""
    # Заменяем пробелы на подчеркивания
    encoded_params = [p.replace(' ', '_') for p in params]
    
    # Формируем строку startapp
    startapp_string = '-'.join([action] + encoded_params)
    
    return f"https://t.me/{BOT_USERNAME}/{APP_NAME}?startapp={startapp_string}"

# Примеры кнопок
keyboard = InlineKeyboardMarkup(inline_keyboard=[
    [InlineKeyboardButton(
        text="📖 API",
        web_app=WebAppInfo(url=create_telegram_deeplink("api"))
    )],
    [InlineKeyboardButton(
        text="🔍 Похожие на Balloons",
        web_app=WebAppInfo(url=create_telegram_deeplink("similar", "Delicious Cake", "Balloons"))
    )],
    [InlineKeyboardButton(
        text="🎨 Модели на Amber",
        web_app=WebAppInfo(url=create_telegram_deeplink("monochrome_color", "Blue Star", "Amber"))
    )],
    [InlineKeyboardButton(
        text="📂 Тематики Ghost",
        web_app=WebAppInfo(url=create_telegram_deeplink("theme", "Ghost", "Spooky"))
    )]
])

await message.answer("Выберите действие:", reply_markup=keyboard)
```

### python-telegram-bot

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

BOT_USERNAME = "testwebapps1_bot"
APP_NAME = "app"

def create_telegram_deeplink(action, *params):
    """Создаёт deep link для Telegram WebApp"""
    encoded_params = [p.replace(' ', '_') for p in params]
    startapp_string = '-'.join([action] + encoded_params)
    return f"https://t.me/{BOT_USERNAME}/{APP_NAME}?startapp={startapp_string}"

# Примеры кнопок
keyboard = [
    [InlineKeyboardButton("📖 API", web_app=WebAppInfo(url=create_telegram_deeplink("api")))],
    [InlineKeyboardButton("🔍 Похожие", web_app=WebAppInfo(url=create_telegram_deeplink("similar", "Blue Star", "Deer")))],
    [InlineKeyboardButton("🎨 Монохромы", web_app=WebAppInfo(url=create_telegram_deeplink("monochrome_color", "Ghost", "Pink")))]
]

reply_markup = InlineKeyboardMarkup(keyboard)
await update.message.reply_text("Выберите действие:", reply_markup=reply_markup)
```

---

## 📝 Важные правила

1. **Пробелы** → заменяйте на `_` (подчеркивание)
   - ✅ `Delicious_Cake`
   - ❌ `Delicious Cake`
   - ❌ `Delicious%20Cake`

2. **Разделитель** → используйте `-` (дефис)
   - ✅ `similar-Blue_Star-Deer`
   - ❌ `similar/Blue_Star/Deer`

3. **Регистр** → сохраняйте оригинальный регистр
   - ✅ `Blue Star` → `Blue_Star`
   - ❌ `blue star` → `blue_star`

4. **Параметр startapp** → обязателен для Telegram
   - ✅ `?startapp=api`
   - ❌ `?action=api`

---

## 🔄 Альтернативный формат (обычный веб)

Если вы используете WebApp не через Telegram (например, для тестирования в браузере), используйте обычный query string:

```
https://ваш-домен/index.html?action=api
https://ваш-домен/index.html?action=similar&gift=Blue%20Star&model=Deer
```

**Система автоматически распознает оба формата!**

---

## ✅ Примеры для тестирования

**Замените `testwebapps1_bot` на имя вашего бота:**

### Простые действия
```
API:
https://t.me/testwebapps1_bot/app?startapp=api

Донат:
https://t.me/testwebapps1_bot/app?startapp=donate
```

### Монохромы
```
Delicious Cake на Amber:
https://t.me/testwebapps1_bot/app?startapp=monochrome_color-Delicious_Cake-Amber

Фоны для Blue Star - Deer:
https://t.me/testwebapps1_bot/app?startapp=monochrome_model-Blue_Star-Deer
```

### Похожие
```
Похожие на Ghost - Spooky:
https://t.me/testwebapps1_bot/app?startapp=similar-Ghost-Spooky

Похожие на Green Star - Tree (50 коллекций):
https://t.me/testwebapps1_bot/app?startapp=similar-Green_Star-Tree-50
```

### Тематики
```
Тематики:
https://t.me/testwebapps1_bot/app?startapp=theme

Тематики для Delicious Cake - Balloons:
https://t.me/testwebapps1_bot/app?startapp=theme-Delicious_Cake-Balloons
```

---

**Обновлено:** 26.01.2026  
**Версия:** 2.0 (с поддержкой Telegram startapp)
