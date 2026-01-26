# 🔗 Быстрый старт: Deep Links для NFTMatch

## Основные рабочие ссылки

Замените `https://ваш-домен` на реальный URL вашего WebApp.

---

### 📖 API и Поддержка

```
https://ваш-домен/index.html?action=api
https://ваш-домен/index.html?action=donate
```

---

### 🎨 Монохромы - Модели по цвету

**Формат:**
```
https://ваш-домен/index.html?action=monochrome_color&gift=НАЗВАНИЕ_КОЛЛЕКЦИИ&color=ЦВЕТ_ФОНА
```

**Примеры:**
```
https://ваш-домен/index.html?action=monochrome_color&gift=Delicious%20Cake&color=Amber
https://ваш-домен/index.html?action=monochrome_color&gift=Green%20Star&color=Aqua
https://ваш-домен/index.html?action=monochrome_color&gift=Blue%20Star&color=Blue
```

---

### 🌈 Монохромы - Фоны для модели

**Формат:**
```
https://ваш-домен/index.html?action=monochrome_model&gift=НАЗВАНИЕ_КОЛЛЕКЦИИ&model=НАЗВАНИЕ_МОДЕЛИ
```

**Примеры:**
```
https://ваш-домен/index.html?action=monochrome_model&gift=Delicious%20Cake&model=Balloons
https://ваш-домен/index.html?action=monochrome_model&gift=Blue%20Star&model=Deer
https://ваш-домен/index.html?action=monochrome_model&gift=Green%20Star&model=Tree
```

---

### 🔍 Похожие модели

**Формат:**
```
https://ваш-домен/index.html?action=similar&gift=НАЗВАНИЕ_КОЛЛЕКЦИИ&model=НАЗВАНИЕ_МОДЕЛИ&count=КОЛИЧЕСТВО
```

**Примеры:**
```
https://ваш-домен/index.html?action=similar&gift=Delicious%20Cake&model=Balloons
https://ваш-домен/index.html?action=similar&gift=Blue%20Star&model=Deer&count=50
https://ваш-домен/index.html?action=similar&gift=Green%20Star&model=Tree&count=100
```

---

### 📂 Тематики

**Формат:**
```
https://ваш-домен/index.html?action=theme
https://ваш-домен/index.html?action=theme&gift=КОЛЛЕКЦИЯ&model=МОДЕЛЬ
https://ваш-домен/index.html?action=theme&gift=КОЛЛЕКЦИЯ&model=МОДЕЛЬ&theme=ТЕМАТИКА
```

**Примеры:**
```
https://ваш-домен/index.html?action=theme
https://ваш-домен/index.html?action=theme&gift=Delicious%20Cake&model=Balloons
https://ваш-домен/index.html?action=theme&gift=Blue%20Star&model=Deer
```

---

## 🤖 Для Telegram Бота (Python)

```python
from telegram import InlineKeyboardButton, WebAppInfo

WEBAPP_URL = "https://ваш-домен/index.html"

# Примеры кнопок
api_btn = InlineKeyboardButton(
    "📖 API",
    web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=api")
)

similar_btn = InlineKeyboardButton(
    "🔍 Похожие",
    web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=similar&gift=Delicious%20Cake&model=Balloons")
)

mono_color_btn = InlineKeyboardButton(
    "🎨 Монохромы",
    web_app=WebAppInfo(url=f"{WEBAPP_URL}?action=monochrome_color&gift=Blue%20Star&color=Aqua")
)
```

---

## 📝 Важно

1. **Пробелы**: Кодируйте как `%20` (например: `Delicious%20Cake`)
2. **Кнопка назад**: Всегда ведёт на главную страницу
3. **Без перескоков**: Плавный переход без показа главной страницы
4. **Индикатор загрузки**: Автоматически показывается при обработке ссылки

---

## 🧪 Тестирование

Откройте файл `deeplink-test.html` в браузере для интерактивного тестирования всех ссылок.

Полная документация: см. файл `DEEPLINK_GUIDE.md`
