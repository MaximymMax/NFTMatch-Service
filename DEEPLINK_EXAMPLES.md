# 📋 Примеры Deep Links с реальными данными

## Популярные коллекции и модели

Ниже представлены рабочие примеры deep links с реальными названиями коллекций и моделей из Telegram Gifts.

---

## 🎨 Монохромы - Модели по цвету фона

### Delicious Cake
```
Amber:   ?action=monochrome_color&gift=Delicious%20Cake&color=Amber
Aqua:    ?action=monochrome_color&gift=Delicious%20Cake&color=Aqua
Blue:    ?action=monochrome_color&gift=Delicious%20Cake&color=Blue
Green:   ?action=monochrome_color&gift=Delicious%20Cake&color=Green
Pink:    ?action=monochrome_color&gift=Delicious%20Cake&color=Pink
Red:     ?action=monochrome_color&gift=Delicious%20Cake&color=Red
```

### Blue Star
```
Amber:   ?action=monochrome_color&gift=Blue%20Star&color=Amber
Aqua:    ?action=monochrome_color&gift=Blue%20Star&color=Aqua
Blue:    ?action=monochrome_color&gift=Blue%20Star&color=Blue
Green:   ?action=monochrome_color&gift=Blue%20Star&color=Green
```

### Green Star
```
Amber:   ?action=monochrome_color&gift=Green%20Star&color=Amber
Aqua:    ?action=monochrome_color&gift=Green%20Star&color=Aqua
Green:   ?action=monochrome_color&gift=Green%20Star&color=Green
```

### Ghost
```
Amber:   ?action=monochrome_color&gift=Ghost&color=Amber
Blue:    ?action=monochrome_color&gift=Ghost&color=Blue
Pink:    ?action=monochrome_color&gift=Ghost&color=Pink
```

---

## 🌈 Монохромы - Фоны для модели

### Delicious Cake
```
Balloons:     ?action=monochrome_model&gift=Delicious%20Cake&model=Balloons
Birthday:     ?action=monochrome_model&gift=Delicious%20Cake&model=Birthday
Cake:         ?action=monochrome_model&gift=Delicious%20Cake&model=Cake
Celebration:  ?action=monochrome_model&gift=Delicious%20Cake&model=Celebration
```

### Blue Star
```
Deer:         ?action=monochrome_model&gift=Blue%20Star&model=Deer
Stars:        ?action=monochrome_model&gift=Blue%20Star&model=Stars
Winter:       ?action=monochrome_model&gift=Blue%20Star&model=Winter
```

### Green Star
```
Tree:         ?action=monochrome_model&gift=Green%20Star&model=Tree
Forest:       ?action=monochrome_model&gift=Green%20Star&model=Forest
Nature:       ?action=monochrome_model&gift=Green%20Star&model=Nature
```

### Ghost
```
Spooky:       ?action=monochrome_model&gift=Ghost&model=Spooky
Halloween:    ?action=monochrome_model&gift=Ghost&model=Halloween
Boo:          ?action=monochrome_model&gift=Ghost&model=Boo
```

---

## 🔍 Похожие модели

### Популярные модели для поиска похожих

```
Delicious Cake - Balloons:
?action=similar&gift=Delicious%20Cake&model=Balloons

Blue Star - Deer:
?action=similar&gift=Blue%20Star&model=Deer&count=50

Green Star - Tree:
?action=similar&gift=Green%20Star&model=Tree&count=100

Ghost - Spooky:
?action=similar&gift=Ghost&model=Spooky

Santa Hat - Santa:
?action=similar&gift=Santa%20Hat&model=Santa

Holiday Drink - Cocoa:
?action=similar&gift=Holiday%20Drink&model=Cocoa&count=75
```

---

## 📂 Тематики

### Просто открыть страницу
```
?action=theme
```

### С конкретной моделью
```
Delicious Cake - Balloons:
?action=theme&gift=Delicious%20Cake&model=Balloons

Blue Star - Deer:
?action=theme&gift=Blue%20Star&model=Deer

Green Star - Tree:
?action=theme&gift=Green%20Star&model=Tree

Ghost - Spooky:
?action=theme&gift=Ghost&model=Spooky
```

### С открытием конкретной тематики
```
Delicious Cake - Balloons (Праздник):
?action=theme&gift=Delicious%20Cake&model=Balloons&theme=Праздник

Blue Star - Deer (Зима):
?action=theme&gift=Blue%20Star&model=Deer&theme=Зима

Green Star - Tree (Природа):
?action=theme&gift=Green%20Star&model=Tree&theme=Природа
```

---

## 🎄 Новогодние коллекции

### Santa Hat
```
Монохромы (Amber):
?action=monochrome_color&gift=Santa%20Hat&color=Amber

Фоны для Santa:
?action=monochrome_model&gift=Santa%20Hat&model=Santa

Похожие на Santa:
?action=similar&gift=Santa%20Hat&model=Santa

Тематики:
?action=theme&gift=Santa%20Hat&model=Santa
```

### Holiday Drink
```
Монохромы (Red):
?action=monochrome_color&gift=Holiday%20Drink&color=Red

Фоны для Cocoa:
?action=monochrome_model&gift=Holiday%20Drink&model=Cocoa

Похожие на Cocoa:
?action=similar&gift=Holiday%20Drink&model=Cocoa
```

### Candy Cane
```
Монохромы (Pink):
?action=monochrome_color&gift=Candy%20Cane&color=Pink

Фоны для Candy:
?action=monochrome_model&gift=Candy%20Cane&model=Candy

Похожие на Candy:
?action=similar&gift=Candy%20Cane&model=Candy
```

### Xmas Stocking
```
Монохромы (Green):
?action=monochrome_color&gift=Xmas%20Stocking&color=Green

Фоны для Stocking:
?action=monochrome_model&gift=Xmas%20Stocking&model=Stocking

Похожие на Stocking:
?action=similar&gift=Xmas%20Stocking&model=Stocking
```

---

## 🎃 Halloween коллекции

### Ghost
```
Монохромы (Amber):
?action=monochrome_color&gift=Ghost&color=Amber

Фоны для Spooky:
?action=monochrome_model&gift=Ghost&model=Spooky

Похожие на Spooky:
?action=similar&gift=Ghost&model=Spooky

Тематики:
?action=theme&gift=Ghost&model=Spooky&theme=Halloween
```

---

## 💡 Советы по использованию

### В Telegram боте (динамическая генерация)

```python
def create_deeplink(action, gift=None, model=None, color=None, theme=None, count=None):
    """Создаёт deep link для NFTMatch WebApp"""
    base_url = "https://ваш-домен/index.html"
    params = [f"action={action}"]
    
    if gift:
        params.append(f"gift={quote(gift)}")
    if model:
        params.append(f"model={quote(model)}")
    if color:
        params.append(f"color={quote(color)}")
    if theme:
        params.append(f"theme={quote(theme)}")
    if count:
        params.append(f"count={count}")
    
    return f"{base_url}?{'&'.join(params)}"

# Примеры использования:
link1 = create_deeplink("monochrome_color", gift="Delicious Cake", color="Amber")
link2 = create_deeplink("similar", gift="Blue Star", model="Deer", count=50)
link3 = create_deeplink("theme", gift="Ghost", model="Spooky", theme="Halloween")
```

### В Telegram Mini App кнопках

```python
from telegram import InlineKeyboardButton, WebAppInfo

keyboard = [
    [
        InlineKeyboardButton(
            "🎨 Модели на Amber",
            web_app=WebAppInfo(url=create_deeplink("monochrome_color", "Delicious Cake", color="Amber"))
        )
    ],
    [
        InlineKeyboardButton(
            "🔍 Похожие на Deer",
            web_app=WebAppInfo(url=create_deeplink("similar", "Blue Star", "Deer"))
        )
    ],
    [
        InlineKeyboardButton(
            "📂 Тематики Ghost",
            web_app=WebAppInfo(url=create_deeplink("theme", "Ghost", "Spooky"))
        )
    ]
]
```

---

## 📝 Примечания

- Все названия чувствительны к регистру
- Пробелы кодируются как `%20`
- Проверяйте точность названий коллекций и моделей
- Названия цветов фонов: Amber, Aqua, Blue, Green, Pink, Red, Purple, Orange, Yellow и др.

---

**Обновлено:** 26.01.2026
