# 🎨 NFT Match - Telegram Gifts & NFTs Matcher

[English](#english) | [Русский](#русский)

---

<a name="english"></a>
## English

**NFT Match** is a specialized analytical service designed for Telegram NFT Gift collectors. It helps users discover the most aesthetically harmonious combinations of gift models and backgrounds, search for visually similar items, and browse thematic collections.

### 💡 Core Idea
The visual appeal of Telegram Gifts often depends on the color synergy between the 3D model and its backdrop. **NFT Match** enables collectors to select and match background colors for any gift to create high-value "monochrome" combinations.

### ⚙️ How It Works
At the heart of the service lies the **CIEDE2000 (Delta E 2000)** color difference algorithm:
1. The system extracts the dominant color of the NFT model.
2. It compares this color against the background gradients in the L\*a\*b\* color space (which aligns with human color perception).
3. The background with the highest matching percentage is recommended.

### 📂 Website Structure & Routing
- **Home Page:** `/index.html` — Entry point, active carousel, and features grid.
- **Monochromes:** `/Monohrome/background-finder.html` — Tool for matching model colors with backgrounds.
- **Similar:** `/nft-page/index.html` — Algorithmic search for visually similar gifts across collections.
- **Thematics:** `/Thematic/themes.html` — Catalog of items grouped into semantic categories with floor prices.
- **API Credentials:** `/API_info/api.html` — API key generation hub for developers.
- **Support:** `/Support/support.html` — Support the project development.

### 🔌 Open API
The service provides a public API for developers:
- **API Keys Management:** [nftmatch.pro/API_info/api.html](https://nftmatch.pro/API_info/api.html)
- **Swagger Documentation:** [nftmatch.pro/api/swagger/ui](https://nftmatch.pro/api/swagger/ui)

---

<a name="русский"></a>
## Русский

**NFT Match** — аналитический сервис в сфере Telegram NFT-подарков, созданный для коллекционеров. Он позволяет подбирать наилучшие сочетания 3D-модели подарка и его заднего фона, искать визуально похожие модели и изучать тематические подборки.

### 💡 Суть проекта
Внешний вид подарков в Telegram сильно зависит от цветового соответствия самой фигурки и её фона. **NFT Match** помогает коллекционерам подбирать идеальные фоны под фигурки для создания гармоничных и ценных «монохромных» сочетаний.

### ⚙️ Как это работает
В основе подбора лежит математический алгоритм сходства цветов **CIEDE2000 (Delta E 2000)**:
1. Алгоритм берет основной цвет 3D-модели подарка.
2. Сравнивает его с цветом градиента заднего фона в цветовом пространстве L\*a\*b\* (которое максимально приближено к человеческому восприятию цветов).
3. Находит фон, который набирает наибольший процент цветового сходства.

### 📂 Структура сайта и пути (Routing)
- **Главная страница:** `/index.html` — Входная точка, карусель продаж и меню функций.
- **Монохромы:** `/Monohrome/background-finder.html` — Инструмент для автоматического сопоставления модели и фона.
- **Похожие:** `/nft-page/index.html` — Поиск визуально и геометрически похожих подарков по всем коллекциям.
- **Тематики:** `/Thematic/themes.html` — Каталог подарков, сгруппированных по смысловым категориям, с ценами Floor Price.
- **Личный кабинет API:** `/API_info/api.html` — Панель выпуска ключей для разработчиков.
- **Поддержка:** `/Support/support.html` — Страница помощи развитию проекта.

### 🔌 Доступ к API
Сервер предоставляет открытый программный интерфейс:
- **Получить API-ключ:** [nftmatch.pro/API_info/api.html](https://nftmatch.pro/API_info/api.html)
- **Документация Swagger UI:** [nftmatch.pro/api/swagger/ui](https://nftmatch.pro/api/swagger/ui)
