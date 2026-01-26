# 🔧 Исправление проблемы с кнопкой "Назад"

## Проблема

При переходе по реферальной ссылке (например, `https://t.me/testwebapps1_bot/app?startapp=api`):
1. Открывалась нужная страница (например, страница API)
2. Но при нажатии кнопки "Назад" происходило возвращение на `index.html?startapp=api`
3. Код снова обрабатывал параметр `startapp=api` и перенаправлял обратно на страницу API
4. **Получался бесконечный цикл** 🔄

## Решение

Добавлена функция `clearDeepLinkParams()`, которая:
- Вызывается сразу после обнаружения deep link параметров
- Удаляет все параметры deep linking из URL (`action`, `startapp`, `gift`, `color`, `model`, `count`, `theme`)
- Использует `window.history.replaceState()` для обновления URL без перезагрузки страницы
- Оставляет чистый URL (например, просто `index.html`)

## Как это работает

### До исправления:
```
1. Пользователь переходит по ссылке: index.html?startapp=api
2. Код обрабатывает параметр и перенаправляет на: ./API_info/api.html
3. В истории браузера: [index.html?startapp=api] → [./API_info/api.html]
4. При нажатии "Назад": возврат на index.html?startapp=api
5. Код снова видит параметр startapp=api и перенаправляет на API_info/api.html
6. ЦИКЛ! ❌
```

### После исправления:
```
1. Пользователь переходит по ссылке: index.html?startapp=api
2. Код обрабатывает параметр
3. Код ОЧИЩАЕТ URL: index.html?startapp=api → index.html (без параметров)
4. Код перенаправляет на: ./API_info/api.html
5. В истории браузера: [index.html] → [./API_info/api.html]
6. При нажатии "Назад": возврат на index.html (БЕЗ параметров!)
7. Код не видит deep link параметров и ничего не делает
8. Всё работает! ✅
```

## Изменения в коде

В файле `main-page.js`:

```javascript
function handleDeepLink() {
    // ... обнаружение параметров ...
    
    console.log('[DeepLink] Processing action:', action);
    
    // ✨ НОВОЕ: очищаем URL от параметров
    clearDeepLinkParams();
    
    // Показываем индикатор загрузки
    showLoadingIndicator();
    
    // Обрабатываем действие
    // ...
}

// ✨ НОВАЯ ФУНКЦИЯ
function clearDeepLinkParams() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    
    // Удаляем все параметры deep linking
    const deepLinkParams = ['action', 'startapp', 'gift', 'color', 'model', 'count', 'theme'];
    let hasChanges = false;
    
    deepLinkParams.forEach(param => {
        if (params.has(param)) {
            params.delete(param);
            hasChanges = true;
        }
    });
    
    if (hasChanges) {
        // Обновляем URL без перезагрузки страницы
        const newUrl = params.toString() 
            ? `${url.pathname}?${params.toString()}`
            : url.pathname;
        
        window.history.replaceState({}, '', newUrl);
        console.log('[DeepLink] URL cleaned:', newUrl);
    }
}
```

## Тестирование

Чтобы проверить исправление:

1. Откройте `deeplink-test.html`
2. Кликните на любую ссылку (например, "Страница API")
3. Нажмите кнопку "Назад" в браузере
4. ✅ Вы должны вернуться на главную страницу БЕЗ повторного перенаправления

Или в Telegram WebApp:
1. Перейдите по ссылке `https://t.me/testwebapps1_bot/app?startapp=api`
2. Откроется страница API
3. Нажмите кнопку "Назад" в Telegram
4. ✅ Вы вернётесь на главную страницу приложения

## Статус

✅ **Исправлено**  
📅 **Дата:** 26.01.2026  
🔧 **Файл:** `main-page.js`  
📝 **Commit:** Готово к коммиту

---

**Примечание:** Другие параметры URL (например, `bypass` для обхода проверки) сохраняются и не удаляются.
