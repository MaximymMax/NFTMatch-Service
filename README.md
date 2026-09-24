# NFT Match

Analytics service for collectors of [Telegram NFT gifts](https://fragment.com/gifts). Matches gift models with backdrops, finds visually similar models and organises the catalogue into themes.

**Site:** [nftmatch.pro](https://nftmatch.pro) · **Bot:** [@NFTMatchbot](https://t.me/NFTMatchbot) · **API:** [documentation](https://nftmatch.pro/API_info/api.html)

The catalogue holds over 7000 models and around 600 000 possible model + backdrop combinations.

[English](#english) | [Русский](#русский)

---

<a name="english"></a>
## English

### Features

- **Backdrop matching** for a model — and the other way round, models for a given backdrop
- **Monochrome combination types** — shows exactly *how* a backdrop fits
- **Similar model search** by colour profile, across the whole catalogue
- **Themes** — over 500 themes, 70 groups and 315 theme-to-group links, each with the reason a model belongs
- **Telegram bot** with the full feature set
- **Public API** for embedding into third-party services

### How the algorithm works

#### Colour profile of a model

A model is a Lottie animation, and it usually has no single "main colour": there is a base tone, a shadow, a highlight, a small patch of something else. So instead of one averaged colour the service breaks a model down into **colour cubes** — large patches, each with its own colour and a weight as a share of the area.

#### Similarity scoring

Distance between colours is computed in **CIELAB** using the **HyABScaled** metric: the perceptual lightness and chroma normalisations are taken from CIEDE2000, while the distance itself is measured directly over Δa/Δb in Cartesian coordinates, as in HyAB.

Hue angle is never computed, which removes its instability on low-chroma colours, where the a and b components are close to zero.

For every colour of a model the result is two values: how close the backdrop is to that colour, and the share of that colour in the model.

#### Monochrome types

A separate classifier determines **how** the match happened. Every cube is assigned a relation to the backdrop — same colour, a shade of the same colour, a highlight, a foreign colour — and the verdict follows from their combined shares:

| Type | Meaning |
|---|---|
| **Pure** | the object is the same colour as the backdrop |
| **Tonal** | one colour in different shades: light, shadow, highlight |
| **Accent** | backdrop colour with small inserts of another |
| **Achromatic** | black, white or grey object on a black, grey or white backdrop |
| **Lightness contrast** | same hue, different lightness — reads as a different colour |
| **Semi-monochrome** | the backdrop matches only part of the object |

Out of 600 000 combinations about 7000 turn out to be monochrome — just over one percent. Pure ones: 223.

### API

The API exposes the same data the site and the bot run on:

- **Matching** — backdrops for a model, models for a backdrop, similar models, search by colour recipe
- **Monochromes** — the type of a model + backdrop combination and ready-made monochrome lists per backdrop
- **Colour profile** — model cubes with weights, dominant colours
- **Themes** — the tree of groups and themes, model membership, search
- **Catalogue** — collections, models, backdrops, floor prices

A free key with basic limits is available to everyone. An extended key is free for open public projects that credit NFT Match; for private projects it is a one-time payment of 20 Gram.

---

**Contact:** [@Criminal_hamster](https://t.me/Criminal_hamster)

---

<a name="русский"></a>
## Русский

Аналитический сервис для коллекционеров [Telegram NFT-подарков](https://fragment.com/gifts). Подбирает сочетания модели подарка и заднего фона, ищет визуально похожие модели и раскладывает каталог по тематикам.

В каталоге более 7000 моделей и около 600 000 возможных сочетаний модель + фон.

### Что умеет

- **Подбор фонов под модель** — и наоборот, моделей под конкретный фон
- **Типы монохромных сочетаний** — показывает, чем именно подходит
- **Поиск похожих моделей** по цветовому профилю, через весь каталог
- **Тематики** — более 500 тем, 70 групп и 315 связей тематика-группа, с указанием признака принадлежности
- **Telegram-бот** с полным функционалом
- **Публичное API** для встраивания в сторонние сервисы

### Как работает алгоритм

#### Цветовой профиль модели

Модель — это Lottie-анимация, и «главного цвета» у неё обычно нет: есть основной, есть тень, блик, мелкая вставка другого оттенка. Поэтому вместо одного усреднённого цвета сервис разбирает модель на **цветовые кубы** — крупные пятна, у каждого свой цвет и вес в процентах площади.

#### Оценка совпадения

Расстояние между цветами вычисляется в цветовом пространстве **CIELAB** метрикой **HyABScaled**: перцептивные нормировки по светлоте и насыщенности взяты из CIEDE2000, само расстояние считается напрямую по Δa/Δb в декартовых координатах, как в HyAB.

Угол тона при этом не вычисляется — это исключает его неустойчивость на малонасыщенных цветах, где составляющие a и b близки к нулю.

Для каждого цвета модели результат — два значения: близость фона к этому цвету и доля этого цвета в модели.

#### Типы монохромов

Отдельный классификатор определяет, **каким образом** совпало. Каждый куб получает отношение к фону — тот же цвет, оттенок того же цвета, блик, посторонний, — и по их суммарным долям выносится вердикт:

| Тип | Что это |
|---|---|
| **Чистый** | предмет того же цвета, что и фон |
| **Тональный** | один цвет в разных оттенках: свет, тень, блик |
| **Акцентный** | цвет фона с мелкими вставками другого |
| **Ахроматический** | чёрно-белое или серое на чёрном, сером, белом |
| **Контраст по светлоте** | тон тот же, светлота другая — читается как другой цвет |
| **Полумонохром** | фон совпал лишь с частью предмета |

Из 600 000 сочетаний монохромами оказываются около 7000 — чуть больше процента. Чистых — 223.

### API

Наружу отдаётся то же, на чём работают сайт и бот:

- **Подбор** — фоны под модель, модели под фон, похожие модели, поиск по цветовому рецепту
- **Монохромы** — тип сочетания модель + фон и готовые списки монохромов по фону
- **Цветовой профиль** — кубы модели с весами, доминирующие цвета
- **Тематики** — дерево групп и тем, принадлежность модели, поиск
- **Каталог** — коллекции, модели, фоны, флор-цены

Бесплатный ключ с базовыми лимитами доступен всем. Расширенный — бесплатно для открытых публичных проектов с упоминанием NFT Match; для частных проектов единоразово 20 Gram.

---

**Контакт:** [@Criminal_hamster](https://t.me/Criminal_hamster)
