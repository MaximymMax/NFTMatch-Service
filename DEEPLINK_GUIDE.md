# Deep Linking для NFTMatch WebApp

## Описание

Система deep linking позволяет открывать конкретные страницы и функции WebApp через прямые ссылки из Telegram бота или других источников.

## Базовый URL

Все ссылки начинаются с главной страницы:
```
https://ваш-домен/index.html?action=...
```

Для Telegram WebApp кнопки используйте:
```
https://t.me/ВАШ_БОТ/app?startapp=ACTION_ПАРАМЕТРЫ
```

---

## Доступные действия (actions)

### 1. Открыть страницу API

**Параметры:**
- `action=api`

**Пример ссылки:**
```
https://ваш-домен/index.html?action=api
```

**Для Telegram кнопки:**
```javascript
{
  text: "📖 Документация API",
  web_app: { url: "https://ваш-домен/index.html?action=api" }
}
```

---

### 2. Открыть страницу Доната/Поддержки

**Параметры:**
- `action=donate` или `action=support`

**Пример ссылки:**
```
https://ваш-домен/index.html?action=donate
```

**Для Telegram кнопки:**
```javascript
{
  text: "💎 Поддержать проект",
  web_app: { url: "https://ваш-домен/index.html?action=support" }
}
```

---

### 3. Открыть Монохромы под коллекцию + фон

**Параметры:**
- `action=monochrome_color`
- `gift` - название коллекции (обязательно)
- `color` - название фона (обязательно)

**Пример ссылки:**
```
https://ваш-домен/index.html?action=monochrome_color&gift=Delicious%20Cake&color=Amber
```

**Реальные примеры:**

1. Delicious Cake на фоне Amber:
```
https://ваш-домен/index.html?action=monochrome_color&gift=Delicious%20Cake&color=Amber
```

2. Green Star на фоне Aqua:
```
https://ваш-домен/index.html?action=monochrome_color&gift=Green%20Star&color=Aqua
```

3. Blue Star на фоне Blue:
```
https://ваш-домен/index.html?action=monochrome_color&gift=Blue%20Star&color=Blue
```

**Для Telegram кнопки:**
```javascript
{
  text: "🎨 Модели для Delicious Cake на Amber",
  web_app: { url: "https://ваш-домен/index.html?action=monochrome_color&gift=Delicious%20Cake&color=Amber" }
}
```

---

### 4. Открыть Монохромы под коллекцию + модель

**Параметры:**
- `action=monochrome_model`
- `gift` - название коллекции (обязательно)
- `model` - название модели (обязательно)

**Пример ссылки:**
```
https://ваш-домен/index.html?action=monochrome_model&gift=Delicious%20Cake&model=Balloons
```

**Реальные примеры:**

1. Найти фоны для Delicious Cake - Balloons:
```
https://ваш-домен/index.html?action=monochrome_model&gift=Delicious%20Cake&model=Balloons
```

2. Найти фоны для Blue Star - Deer:
```
https://ваш-домен/index.html?action=monochrome_model&gift=Blue%20Star&model=Deer
```

3. Найти фоны для Green Star - Tree:
```
https://ваш-домен/index.html?action=monochrome_model&gift=Green%20Star&model=Tree
```

**Для Telegram кнопки:**
```javascript
{
  text: "🌈 Фоны для Delicious Cake - Balloons",
  web_app: { url: "https://ваш-домен/index.html?action=monochrome_model&gift=Delicious%20Cake&model=Balloons" }
}
```

---

### 5. Открыть Похожие модели на заданную

**Параметры:**
- `action=similar`
- `gift` - название коллекции (обязательно)
- `model` - название модели (обязательно)
- `count` - количество коллекций для поиска (опционально, по умолчанию 100)

**Пример ссылки:**
```
https://ваш-домен/index.html?action=similar&gift=Delicious%20Cake&model=Balloons&count=50
```

**Реальные примеры:**

1. Похожие на Delicious Cake - Balloons:
```
https://ваш-домен/index.html?action=similar&gift=Delicious%20Cake&model=Balloons
```

2. Похожие на Blue Star - Deer с поиском по 50 коллекциям:
```
https://ваш-домен/index.html?action=similar&gift=Blue%20Star&model=Deer&count=50
```

3. Похожие на Green Star - Tree с поиском по всем коллекциям:
```
https://ваш-домен/index.html?action=similar&gift=Green%20Star&model=Tree&count=100
```

**Для Telegram кнопки:**
```javascript
{
  text: "🔍 Найти похожие на Balloons",
  web_app: { url: "https://ваш-домен/index.html?action=similar&gift=Delicious%20Cake&model=Balloons" }
}
```

---

### 6. Открыть страницу с Тематиками (с опциональным открытием модалки)

**Параметры:**
- `action=theme`
- `gift` - название коллекции (опционально, для открытия тематик конкретной модели)
- `model` - название модели (опционально, для открытия тематик конкретной модели)
- `theme` - название тематики (опционально, для автоматического открытия модалки)

**Примеры ссылок:**

1. Просто открыть страницу тематик:
```
https://ваш-домен/index.html?action=theme
```

2. Открыть тематики для конкретной модели:
```
https://ваш-домен/index.html?action=theme&gift=Delicious%20Cake&model=Balloons
```

3. Открыть тематики для модели с автоматическим открытием конкретной тематики:
```
https://ваш-домен/index.html?action=theme&gift=Delicious%20Cake&model=Balloons&theme=Праздник
```

**Реальные примеры:**

1. Тематики для Blue Star - Deer:
```
https://ваш-домен/index.html?action=theme&gift=Blue%20Star&model=Deer
```

2. Тематики для Green Star - Tree с открытием "Зима":
```
https://ваш-домен/index.html?action=theme&gift=Green%20Star&model=Tree&theme=Зима
```

**Для Telegram кнопки:**
```javascript
{
  text: "📂 Тематики",
  web_app: { url: "https://ваш-домен/index.html?action=theme" }
}

// Или с конкретной моделью:
{
  text: "📂 Тематики для Balloons",
  web_app: { url: "https://ваш-домен/index.html?action=theme&gift=Delicious%20Cake&model=Balloons" }
}
```

---

## Полные рабочие примеры для тестирования

Замените `https://ваш-домен` на актуальный адрес вашего WebApp:

### API и поддержка:
```
https://ваш-домен/index.html?action=api
https://ваш-домен/index.html?action=donate
```

### Монохромы:
```
https://ваш-домен/index.html?action=monochrome_color&gift=Delicious%20Cake&color=Amber
https://ваш-домен/index.html?action=monochrome_model&gift=Delicious%20Cake&model=Balloons
```

### Похожие:
```
https://ваш-домен/index.html?action=similar&gift=Delicious%20Cake&model=Balloons
https://ваш-домен/index.html?action=similar&gift=Blue%20Star&model=Deer&count=50
```

### Тематики:
```
https://ваш-домен/index.html?action=theme
https://ваш-домен/index.html?action=theme&gift=Delicious%20Cake&model=Balloons
https://ваш-домен/index.html?action=theme&gift=Green%20Star&model=Tree&theme=Зима
```

---

## Примечания

1. **Кодирование URL**: Все названия с пробелами должны быть закодированы (`%20` вместо пробела). JavaScript автоматически делает это через `encodeURIComponent()`.

2. **Кнопка "Назад"**: При переходе по deep link кнопка "Назад" в Telegram WebApp будет возвращать пользователя на главную страницу.

3. **Индикатор загрузки**: При обработке deep link показывается индикатор загрузки, чтобы пользователь видел что происходит процесс перехода.

4. **Без перескоков**: Переход происходит плавно, без показа главной страницы - сразу перенаправление на целевую страницу.

---

## Пример использования в Telegram боте (Python)

```python
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo

# Базовый URL вашего WebApp
WEBAPP_URL = "https://ваш-домен/index.html"

# Кнопка для открытия API
api_button = InlineKeyboardButton(
    text="📖 API",
    web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=api")
)

# Кнопка для поиска похожих на конкретную модель
similar_button = InlineKeyboardButton(
    text="🔍 Похожие",
    web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=similar&gift=Delicious%20Cake&model=Balloons")
)

# Кнопка для монохромов
mono_button = InlineKeyboardButton(
    text="🎨 Монохромы",
    web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=monochrome_color&gift=Blue%20Star&color=Aqua")
)

keyboard = InlineKeyboardMarkup([[api_button], [similar_button], [mono_button]])

await update.message.reply_text("Выберите действие:", reply_markup=keyboard)
```

---

## Решение проблем

**Проблема**: Ссылка не работает, открывается главная страница
- Проверьте правильность написания параметра `action`
- Убедитесь что обязательные параметры (gift, model, color) присутствуют
- Проверьте кодирование URL (пробелы должны быть `%20`)

**Проблема**: Кнопка "Назад" не возвращает на главную
- Это поведение зависит от настройки Telegram WebApp на страницах назначения
- Проверьте что на целевых страницах правильно настроена кнопка BackButton

**Проблема**: Долго грузится
- Проверьте скорость интернет соединения
- Убедитесь что API сервер отвечает нормально
- Индикатор загрузки должен показываться во время обработки
