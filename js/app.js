// ========== Глобальные переменные ==========
let allProducts = [];
let allWarehouses = [];
let factoryDeliveryDays = {}; // Эталонные значения из файла
let currentSortColumn = '';
let currentSortDirection = 'asc';
let currentWarehouseFilter = '';

// Ключи для localStorage
const STORAGE_KEYS = {
    PRODUCTS: 'wb_products',
    WAREHOUSES: 'wb_warehouses',
    FACTORY: 'wb_factory_delivery_days'
};

// ========== Инициализация приложения ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Приложение загружено');
    
    // Загружаем данные из localStorage
    loadFromStorage();
    loadFactorySettings();
    
    // Обработчик загрузки файла с товарами
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            console.log('📁 Выбран файл с товарами');
            handleFileUpload(event);
        });
    }
    
    // Обработчик загрузки файла со сроками доставки
    const deliveryFileInput = document.getElementById('deliveryFileInput');
    if (deliveryFileInput) {
        deliveryFileInput.addEventListener('change', function(event) {
            console.log('📁 Выбран файл со сроками доставки');
            handleDeliveryFileUpload(event);
        });
    }
    
    // Устанавливаем активную ссылку в меню
    setActiveNavLink('upload');
    
    // Активируем скроллбары
    setTimeout(() => {
        forceHorizontalScroll();
    }, 500);
});

// ========== НАВИГАЦИЯ ==========
function setActiveNavLink(pageName) {
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.classList.remove('active');
        if (link.textContent.includes(pageName === 'upload' ? 'Загрузка' :
                                      pageName === 'warehouses' ? 'Склады' :
                                      pageName === 'products' ? 'Все товары' :
                                      pageName === 'shipments' ? 'Отгрузки' : 'Общая сводка')) {
            link.classList.add('active');
        }
    });
}

function showPage(pageName, event) {
    if (event) event.preventDefault();
    
    // Скрыть все страницы
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Показать выбранную страницу
    const pageMap = {
        'upload': 'uploadPage',
        'warehouses': 'warehousesPage',
        'products': 'productsPage',
        'shipments': 'shipmentsPage',
        'summary': 'summaryPage'
    };
    
    const targetPage = document.getElementById(pageMap[pageName]);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Обновить активную ссылку
    setActiveNavLink(pageName);
    
    // Закрыть мобильное меню
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('active');
    
    // Обновить данные на странице
    if (pageName === 'warehouses') {
        displayWarehouses();
    } else if (pageName === 'products') {
        displayProducts();
    } else if (pageName === 'shipments') {
        loadShipments();
    } else if (pageName === 'summary') {
        displaySummary();
    }
}

function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// ========== РАБОТА С LOCALSTORAGE ==========
function saveWarehousesToStorage() {
    try {
        console.log('💾 Сохраняем склады в localStorage');
        const warehousesToSave = allWarehouses.map(({ id, name, delivery_days, source }) => ({
            id, name, delivery_days, source: source || 'default'
        }));
        localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(warehousesToSave));
        console.log(`✅ Склады сохранены: ${warehousesToSave.length} шт.`);
    } catch (e) {
        console.error('❌ Ошибка сохранения складов:', e);
    }
}

function saveProductsToStorage() {
    try {
        console.log('💾 Сохраняем товары в localStorage');
        const productsToSave = allProducts.map(({ 
            id, warehouse, seller_article, size, name, brand, sold, stock 
        }) => ({
            id, warehouse, seller_article, size, name, brand, sold, stock
        }));
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(productsToSave));
        console.log(`✅ Товары сохранены: ${productsToSave.length} шт.`);
    } catch (e) {
        console.error('❌ Ошибка сохранения товаров:', e);
    }
}

function saveFactorySettings(warehouses) {
    try {
        factoryDeliveryDays = {};
        warehouses.forEach(w => {
            if (w.name && w.delivery_days) {
                factoryDeliveryDays[w.name] = w.delivery_days;
            }
        });
        localStorage.setItem(STORAGE_KEYS.FACTORY, JSON.stringify(factoryDeliveryDays));
        console.log('✅ Заводские настройки сохранены');
    } catch (e) {
        console.error('❌ Ошибка сохранения заводских настроек:', e);
    }
}

function loadFactorySettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEYS.FACTORY);
        if (saved) {
            factoryDeliveryDays = JSON.parse(saved);
            console.log('📂 Заводские настройки загружены');
        }
    } catch (e) {
        console.error('❌ Ошибка загрузки заводских настроек:', e);
        factoryDeliveryDays = {};
    }
}

function loadFromStorage() {
    try {
        console.log('📂 Загрузка данных из localStorage');
        
        // Загружаем склады
        const savedWarehouses = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
        if (savedWarehouses) {
            allWarehouses = JSON.parse(savedWarehouses);
            console.log(`📦 Загружено складов: ${allWarehouses.length}`);
        } else {
            allWarehouses = [];
        }
        
        // Загружаем товары
        const savedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
        if (savedProducts) {
            allProducts = JSON.parse(savedProducts);
            console.log(`📦 Загружено товаров: ${allProducts.length}`);
        } else {
            allProducts = [];
        }
        
        // Добавляем рассчитанные поля к товарам
        if (allProducts.length > 0) {
            allProducts = allProducts.map(product => calculateProductFields(product));
        }
        
        // Обновляем интерфейс
        displayWarehouses();
        displayProducts();
        updateWarehouseFilter();
        updateArticleFilter();
        updateStats();
        loadShipments();
        updateSizeFilter();
        displaySummary();
        
        // Активируем скроллбары после загрузки
        setTimeout(() => {
            forceHorizontalScroll();
        }, 500);
        
    } catch (e) {
        console.error('❌ Ошибка загрузки из localStorage:', e);
        allWarehouses = [];
        allProducts = [];
    }
}

function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ========== РАСЧЕТНЫЕ ФОРМУЛЫ ==========
function calculateProductFields(product) {
    const warehouse = allWarehouses.find(w => w.name === product.warehouse);
    const deliveryDays = warehouse ? warehouse.delivery_days : 7;
    
    // Продажи/день = Продано / 30
    const salesPerDay = product.sold / 30;
    
    // Нужно на 45 дней = Продажи/день × 45
    const needed45 = salesPerDay * 45;
    
    // Дней до 0 = Остаток / Продажи/день
    const daysToZero = salesPerDay > 0 ? Math.floor(product.stock / salesPerDay) : 999;
    
    // Дата риска = сегодня + Дней до 0
    const today = new Date();
    const riskDate = new Date(today);
    riskDate.setDate(riskDate.getDate() + daysToZero);
    
    // Запуск сборки = Дата риска - Доставка дней
    const assemblyDate = new Date(riskDate);
    assemblyDate.setDate(assemblyDate.getDate() - deliveryDays);
    
    const assemblyDateStr = formatDate(assemblyDate);
    
    let assemblyStart = assemblyDateStr;
    let isUrgent = false;
    
    if (assemblyDate <= today) {
        assemblyStart = 'СРОЧНО!';
        isUrgent = true;
    }
    
    // К поставке = Нужно на 45 дней - Остаток
    const toSupply = Math.max(0, Math.ceil(needed45 - product.stock));
    
    // Активность склада
    let activity = 'Низкая';
    if (salesPerDay > 10) activity = 'Высокая';
    else if (salesPerDay > 3) activity = 'Средняя';
    
    return {
        ...product,
        sales_per_day: salesPerDay.toFixed(2),
        needed_45: Math.ceil(needed45),
        days_to_zero: daysToZero,
        risk_date: formatDate(riskDate),
        delivery_days: deliveryDays,
        assembly_start: assemblyStart,
        assembly_date: assemblyDate,
        is_urgent: isUrgent,
        to_supply: toSupply,
        activity: activity
    };
}

function formatDate(date) {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// ========== ЗАГРУЗКА ФАЙЛА С ТОВАРАМИ ==========
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('❌ Файл не выбран');
        return;
    }
    
    console.log('📁 Загружается файл:', file.name, 'размер:', file.size, 'байт');
    
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка и обработка файла...';
    statusDiv.className = 'upload-status';
    statusDiv.style.display = 'block';
    
    try {
        const data = await readFile(file);
        console.log('📊 Прочитано записей:', data.length);
        
        if (data.length === 0) {
            throw new Error('Файл не содержит данных');
        }
        
        await processData(data);
        
        statusDiv.className = 'upload-status success';
        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Файл успешно загружен! Данные сохранены локально.';
        
        // Обновить все фильтры и отображение
        updateWarehouseFilter();
        updateArticleFilter();
        updateSizeFilter();
        displayWarehouses();
        displayProducts();
        loadShipments();
        displaySummary();
        updateStats();
        
        // Очищаем input для возможности повторной загрузки того же файла
        event.target.value = '';
        
        // Активируем скроллбары
        setTimeout(() => {
            forceHorizontalScroll();
        }, 500);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки файла:', error);
        statusDiv.className = 'upload-status error';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ошибка: ' + error.message;
        
        // Очищаем input
        event.target.value = '';
    }
}

// ========== ЗАГРУЗКА ФАЙЛА СО СРОКАМИ ДОСТАВКИ ==========
async function handleDeliveryFileUpload(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('❌ Файл не выбран');
        return;
    }
    
    console.log('📁 Загружается файл со сроками:', file.name, 'размер:', file.size, 'байт');
    
    const statusDiv = document.getElementById('deliveryUploadStatus');
    statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка сроков доставки...';
    statusDiv.className = 'upload-status';
    statusDiv.style.display = 'block';
    
    try {
        const data = await readDeliveryFile(file);
        console.log('📊 Прочитано сроков доставки:', data.length);
        
        if (data.length === 0) {
            throw new Error('Не найдено данных о сроках доставки');
        }
        
        await processDeliveryData(data);
        
        statusDiv.className = 'upload-status success';
        statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Сроки доставки успешно загружены!';
        
        // Обновить отображение
        displayWarehouses();
        displayProducts();
        loadShipments();
        displaySummary();
        
        // Очищаем input для возможности повторной загрузки того же файла
        event.target.value = '';
        
        // Активируем скроллбары
        setTimeout(() => {
            forceHorizontalScroll();
        }, 500);
        
    } catch (error) {
        console.error('❌ Ошибка загрузки сроков доставки:', error);
        statusDiv.className = 'upload-status error';
        statusDiv.innerHTML = '<i class="fas fa-exclamation-circle"></i> Ошибка: ' + error.message;
        
        // Очищаем input
        event.target.value = '';
    }
}

function readDeliveryFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log('📖 Чтение файла со сроками...');
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                console.log('📑 Листы в файле:', workbook.SheetNames);
                
                // Ищем лист "СправочникДоставки"
                let sheetName = 'СправочникДоставки';
                if (!workbook.SheetNames.includes(sheetName)) {
                    // Если нет, берем второй лист (индекс 1) или первый
                    sheetName = workbook.SheetNames[1] || workbook.SheetNames[0];
                    console.log('📑 Используем лист:', sheetName);
                }
                
                const worksheet = workbook.Sheets[sheetName];
                
                // Преобразуем в JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: '',
                    blankrows: false
                });
                
                console.log('📊 Первые 5 строк:', jsonData.slice(0, 5));
                
                // Пропускаем заголовок (первая строка)
                const result = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (row && row.length >= 2 && row[0] && row[1] !== undefined) {
                        // Первый столбец - склад, второй - дней доставки
                        const warehouse = String(row[0]).trim();
                        const days = Number(row[1]);
                        
                        if (warehouse && !isNaN(days) && days > 0) {
                            result.push({
                                warehouse: warehouse,
                                delivery_days: days
                            });
                        }
                    }
                }
                
                console.log(`📦 Загружено сроков доставки: ${result.length} шт.`);
                resolve(result);
            } catch (error) {
                console.error('❌ Ошибка парсинга файла:', error);
                reject(new Error('Не удалось прочитать файл со сроками: ' + error.message));
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ Ошибка чтения файла:', error);
            reject(new Error('Ошибка чтения файла'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

async function processDeliveryData(data) {
    console.log('🔄 Обрабатываем сроки доставки:', data);
    
    let updatedCount = 0;
    let createdCount = 0;
    
    data.forEach(item => {
        const warehouseName = item.warehouse;
        const deliveryDays = Number(item.delivery_days);
        
        if (!warehouseName || isNaN(deliveryDays) || deliveryDays <= 0) return;
        
        // Ищем существующий склад
        const existingWarehouse = allWarehouses.find(w => w.name === warehouseName);
        
        if (existingWarehouse) {
            // Обновляем существующий склад
            existingWarehouse.delivery_days = deliveryDays;
            existingWarehouse.source = 'factory';
            updatedCount++;
        } else {
            // Создаем новый склад
            allWarehouses.push({
                id: generateId(),
                name: warehouseName,
                delivery_days: deliveryDays,
                source: 'factory'
            });
            createdCount++;
        }
    });
    
    // Сохраняем эталонные значения
    const factoryData = {};
    data.forEach(item => {
        if (item.warehouse && item.delivery_days) {
            factoryData[item.warehouse] = item.delivery_days;
        }
    });
    
    // Обновляем глобальный объект
    Object.assign(factoryDeliveryDays, factoryData);
    localStorage.setItem(STORAGE_KEYS.FACTORY, JSON.stringify(factoryDeliveryDays));
    
    // Сохраняем склады
    saveWarehousesToStorage();
    
    // Пересчитываем все товары
    if (allProducts.length > 0) {
        allProducts = allProducts.map(product => calculateProductFields(product));
        saveProductsToStorage();
    }
    
    console.log(`✅ Склады обновлены: создано ${createdCount}, обновлено ${updatedCount}`);
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                console.log('📖 Чтение файла с товарами...');
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                console.log('📑 Листы в файле:', workbook.SheetNames);
                
                // Ищем лист с исходными данными
                let sheetName = 'Исходные';
                if (!workbook.SheetNames.includes(sheetName)) {
                    sheetName = workbook.SheetNames[0];
                    console.log('📑 Используем лист:', sheetName);
                }
                
                const worksheet = workbook.Sheets[sheetName];
                
                // Преобразуем в JSON с учетом двухстрочной шапки
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
                    header: 1,
                    defval: '',
                    blankrows: false
                });
                
                console.log('📊 Первые 5 строк:', jsonData.slice(0, 5));
                
                // Пропускаем первые 2 строки (шапка отчета)
                const dataRows = jsonData.slice(2);
                
                // Заголовки из второй строки
                const headers = jsonData[1] || [];
                console.log('📋 Заголовки:', headers);
                
                // Преобразуем в объекты
                const result = [];
                dataRows.forEach((row, rowIndex) => {
                    if (!row || row.length === 0) return;
                    
                    const obj = {};
                    headers.forEach((header, index) => {
                        if (header && header.trim()) {
                            const headerClean = header.trim();
                            let value = row[index] || '';
                            
                            // Пробуем разные варианты названий
                            if (headerClean.includes('Склад') || headerClean.includes('склад')) {
                                obj.warehouse = String(value).trim();
                            } else if (headerClean.includes('Артикул продавца') || headerClean.includes('артикул')) {
                                obj.seller_article = String(value).trim();
                            } else if (headerClean.includes('Размер') || headerClean.includes('размер')) {
                                obj.size = String(value).trim();
                            } else if (headerClean.includes('Наименование') || headerClean.includes('наименование')) {
                                obj.name = String(value).trim();
                            } else if (headerClean.includes('Бренд') || headerClean.includes('бренд')) {
                                obj.brand = String(value).trim();
                            } else if (headerClean.includes('Продано') || headerClean.includes('продано') || 
                                      headerClean.includes('Выкупили')) {
                                obj.sold = Number(value) || 0;
                            } else if (headerClean.includes('Остаток') || headerClean.includes('остаток') || 
                                      headerClean.includes('Текущий остаток')) {
                                obj.stock = Number(value) || 0;
                            }
                        }
                    });
                    
                    // Добавляем только если есть склад и артикул
                    if (obj.warehouse && obj.seller_article) {
                        result.push(obj);
                    }
                });
                
                console.log(`✅ Прочитано записей: ${result.length}`);
                resolve(result);
            } catch (error) {
                console.error('❌ Ошибка парсинга файла:', error);
                reject(new Error('Не удалось прочитать файл: ' + error.message));
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ Ошибка чтения файла:', error);
            reject(new Error('Ошибка чтения файла'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

async function processData(data) {
    if (!data || data.length === 0) {
        throw new Error('Файл пуст или имеет неверный формат');
    }
    
    console.log('🔄 Обрабатываем данные:', data.length, 'записей');
    
    // Извлечь уникальные склады
    const warehousesMap = new Map();
    
    data.forEach(row => {
        const warehouseName = row.warehouse || '';
        if (warehouseName && !warehousesMap.has(warehouseName)) {
            // Проверяем, есть ли заводское значение
            const factoryDays = factoryDeliveryDays[warehouseName];
            warehousesMap.set(warehouseName, {
                id: generateId(),
                name: warehouseName,
                delivery_days: factoryDays || 7,
                source: factoryDays ? 'factory' : 'default'
            });
        }
    });
    
    // Сохраняем склады (существующие не перезаписываем, только новые)
    const existingWarehouseNames = new Set(allWarehouses.map(w => w.name));
    
    Array.from(warehousesMap.values()).forEach(newWarehouse => {
        if (!existingWarehouseNames.has(newWarehouse.name)) {
            allWarehouses.push(newWarehouse);
        }
    });
    
    saveWarehousesToStorage();
    
    console.log('✅ Склады актуализированы:', allWarehouses.length);
    
    // Создаем товары
    const newProducts = [];
    data.forEach(row => {
        if (!row.warehouse || !row.seller_article) return;
        
        const product = {
            id: generateId(),
            warehouse: row.warehouse,
            seller_article: String(row.seller_article || ''),
            size: String(row.size || ''),
            name: row.name || '',
            brand: row.brand || '',
            sold: Number(row.sold || 0),
            stock: Number(row.stock || 0)
        };
        newProducts.push(product);
    });
    
    allProducts = newProducts;
    saveProductsToStorage();
    
    console.log('✅ Созданы товары:', allProducts.length);
}

// ========== ОТОБРАЖЕНИЕ СКЛАДОВ ==========
function displayWarehouses() {
    const tbody = document.getElementById('warehousesTableBody');
    if (!tbody) return;
    
    if (allWarehouses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Нет данных</h3>
                    <p>Загрузите файл с данными на главной странице</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Сортируем склады по алфавиту
    const sortedWarehouses = [...allWarehouses].sort((a, b) => 
        a.name.localeCompare(b.name, 'ru')
    );
    
    const today = new Date();
    
    tbody.innerHTML = sortedWarehouses.map(warehouse => {
        // Определяем источник
        let sourceBadge = '';
        let sourceText = '';
        
        if (warehouse.source === 'factory') {
            sourceBadge = 'badge-factory';
            sourceText = '📁 Из файла';
        } else if (warehouse.source === 'edited') {
            sourceBadge = 'badge-edited';
            sourceText = '✏️ Изменено';
        } else {
            sourceBadge = 'badge-default';
            sourceText = '⚙️ По умолчанию';
        }
        
        // Рассчитываем дату отгрузки (+12 дней от сегодня с учетом доставки)
        const shipmentDate = new Date(today);
        shipmentDate.setDate(shipmentDate.getDate() + warehouse.delivery_days + 12);
        
        return `
            <tr>
                <td><strong>${warehouse.name}</strong></td>
                <td>
                    <span class="badge ${warehouse.delivery_days <= 3 ? 'badge-urgent' : 
                                        warehouse.delivery_days <= 7 ? 'badge-warning' : 'badge-success'}">
                        ${warehouse.delivery_days} дн.
                    </span>
                </td>
                <td><span class="badge ${sourceBadge}">${sourceText}</span></td>
                <td><span class="badge badge-success">${formatDate(shipmentDate)}</span></td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="editWarehouse('${warehouse.id}')">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// ========== ОТОБРАЖЕНИЕ ТОВАРОВ ==========
function displayProducts() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    
    if (allProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="15" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Нет данных</h3>
                    <p>Загрузите файл с данными на главной странице</p>
                </td>
            </tr>
        `;
        return;
    }
    
    // Применить фильтры
    let filteredProducts = [...allProducts];
    
    // Фильтр по складу
    const warehouseFilter = document.getElementById('warehouseFilter')?.value;
    if (warehouseFilter) {
        filteredProducts = filteredProducts.filter(p => p.warehouse === warehouseFilter);
    }
    
    // Фильтр по артикулу
    const articleFilter = document.getElementById('articleFilter')?.value;
    if (articleFilter) {
        filteredProducts = filteredProducts.filter(p => p.seller_article === articleFilter);
    }
    
    // Поиск по названию и бренду
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(p => 
            (p.name && p.name.toLowerCase().includes(searchTerm)) ||
            (p.brand && p.brand.toLowerCase().includes(searchTerm))
        );
    }
    
    // Применить сортировку
    if (currentSortColumn) {
        filteredProducts.sort((a, b) => {
            let aVal = a[currentSortColumn];
            let bVal = b[currentSortColumn];
            
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            }
            
            aVal = String(aVal || '').toLowerCase();
            bVal = String(bVal || '').toLowerCase();
            
            if (currentSortDirection === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
        });
    }
    
    // Формируем таблицу
    tbody.innerHTML = filteredProducts.map(product => {
        const urgencyClass = product.is_urgent ? 'urgent' : 
                            (product.days_to_zero < 14 ? 'warning' : '');
        
        // ВАЖНО: Здесь рассчитываем общее время доставки (дни доставки + 12 дней)
        const deliveryDays = product.delivery_days || 7;
        const totalDeliveryDays = deliveryDays + 12;
        
        return `
            <tr class="${urgencyClass}">
                <td>${product.warehouse || ''}</td>
                <td><strong>${product.seller_article || ''}</strong></td>
                <td>${product.size || ''}</td>
                <td>${product.name || ''}</td>
                <td>${product.brand || ''}</td>
                <td class="stat-number">${product.sold || 0}</td>
                <td class="stat-number">${product.stock || 0}</td>
                <td class="stat-number">${product.sales_per_day || '0.00'}</td>
                <td class="stat-number">${product.needed_45 || 0}</td>
                <td class="stat-number">${product.to_supply || 0}</td>
                <td class="stat-number">${product.days_to_zero !== undefined ? product.days_to_zero : 999}</td>
                <td>${product.risk_date || ''}</td>
                <td class="stat-number"><strong>${totalDeliveryDays}</strong> дн.</td>
                <td>${product.is_urgent ? '<span class="badge badge-urgent">СРОЧНО!</span>' : (product.assembly_start || '')}</td>
                <td><span class="badge ${product.activity === 'Высокая' ? 'badge-urgent' : 
                                                product.activity === 'Средняя' ? 'badge-warning' : 'badge-success'}">${product.activity || 'Низкая'}</span></td>
            </tr>
        `;
    }).join('');
    
    // Обновляем счетчик результатов
    updateResultsCount(filteredProducts.length, allProducts.length);
    
    // Показываем подсказку прокрутки
    showScrollHint('productsTable');
    
    // Обновляем скроллбары
    setTimeout(() => {
        forceHorizontalScroll();
    }, 200);
}

function updateResultsCount(filtered, total) {
    let counter = document.getElementById('resultsCounter');
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'resultsCounter';
        counter.className = 'results-counter';
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) {
            filtersSection.appendChild(counter);
        }
    }
    
    if (filtered === total) {
        counter.innerHTML = `<i class="fas fa-box"></i> Всего товаров: ${total}`;
    } else {
        counter.innerHTML = `<i class="fas fa-filter"></i> Показано: ${filtered} из ${total}`;
    }
}

// ========== ФИЛЬТРЫ ==========
function updateWarehouseFilter() {
    const select = document.getElementById('warehouseFilter');
    if (!select) return;
    
    if (!allWarehouses || allWarehouses.length === 0) {
        select.innerHTML = '<option value="">Нет складов</option>';
        return;
    }
    
    // Сортируем склады по алфавиту
    const sortedWarehouses = [...allWarehouses].sort((a, b) => 
        a.name.localeCompare(b.name, 'ru')
    );
    
    let options = '<option value="">Все склады</option>';
    sortedWarehouses.forEach(warehouse => {
        options += `<option value="${warehouse.name}">${warehouse.name}</option>`;
    });
    
    select.innerHTML = options;
    
    // Если есть активный фильтр, устанавливаем его
    if (currentWarehouseFilter) {
        select.value = currentWarehouseFilter;
    }
    
    console.log('🔽 Фильтр складов обновлен:', sortedWarehouses.length, 'складов');
}

function updateArticleFilter() {
    const select = document.getElementById('articleFilter');
    if (!select) return;
    
    if (!allProducts || allProducts.length === 0) {
        select.innerHTML = '<option value="">Нет артикулов</option>';
        return;
    }
    
    // Получаем уникальные артикулы
    const articles = [...new Set(allProducts.map(p => p.seller_article))];
    
    // Сортируем
    articles.sort((a, b) => a.localeCompare(b, 'ru'));
    
    let options = '<option value="">Все артикулы</option>';
    articles.forEach(article => {
        if (article) {
            options += `<option value="${article}">${article}</option>`;
        }
    });
    
    select.innerHTML = options;
    console.log('🔽 Фильтр артикулов обновлен:', articles.length, 'артикулов');
}

function updateSizeFilter() {
    const select = document.getElementById('sizeFilter');
    if (!select) return;
    
    if (!allProducts || allProducts.length === 0) {
        select.innerHTML = '<option value="">Нет размеров</option>';
        return;
    }
    
    // Получаем уникальные размеры
    const sizes = [...new Set(allProducts.map(p => p.size))].filter(s => s && s !== '');
    
    // Сортируем
    sizes.sort((a, b) => a.localeCompare(b, 'ru', { numeric: true }));
    
    let options = '<option value="">Все размеры</option>';
    sizes.forEach(size => {
        options += `<option value="${size}">${size}</option>`;
    });
    
    select.innerHTML = options;
    console.log('🔽 Фильтр размеров обновлен:', sizes.length, 'размеров');
}

function filterProducts() {
    displayProducts();
}

function filterByWarehouse(warehouseName) {
    if (!warehouseName) return;
    
    currentWarehouseFilter = warehouseName;
    
    // Обновить заголовок
    const titleElement = document.getElementById('productsPageTitle');
    if (titleElement) {
        titleElement.innerHTML = `<i class="fas fa-table"></i> Товары на складе: ${warehouseName}`;
    }
    
    // Показать кнопку "Назад"
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.style.display = 'inline-flex';
    }
    
    // Установить фильтр
    const filterSelect = document.getElementById('warehouseFilter');
    if (filterSelect) {
        filterSelect.value = warehouseName;
    }
    
    // Перейти на страницу товаров
    showPage('products');
    displayProducts();
}

function clearWarehouseFilter() {
    currentWarehouseFilter = '';
    
    const titleElement = document.getElementById('productsPageTitle');
    if (titleElement) {
        titleElement.innerHTML = '<i class="fas fa-table"></i> Все товары';
    }
    
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.style.display = 'none';
    }
    
    const filterSelect = document.getElementById('warehouseFilter');
    if (filterSelect) {
        filterSelect.value = '';
    }
    
    displayProducts();
}

// ========== СОРТИРОВКА ==========
function sortTable(column) {
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }
    
    displayProducts();
}

// ========== ОТОБРАЖЕНИЕ ОТГРУЗОК ==========
function loadShipments() {
    const grid = document.getElementById('shipmentsGrid');
    if (!grid) return;
    
    if (allProducts.length === 0 || allWarehouses.length === 0) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
                <i class="fas fa-inbox"></i>
                <h3>Нет данных</h3>
                <p>Загрузите файл с данными на главной странице</p>
            </div>
        `;
        return;
    }
    
    // Пересчитываем товары
    allProducts = allProducts.map(p => calculateProductFields(p));
    
    // Группировать товары по складам
    const warehouseShipments = {};
    const today = new Date();
    
    allProducts.forEach(product => {
        if (!warehouseShipments[product.warehouse]) {
            warehouseShipments[product.warehouse] = {
                name: product.warehouse,
                earliestDate: product.assembly_date,
                earliestDateStr: product.assembly_start,
                urgentCount: 0,
                totalProducts: 0,
                shipmentDate: null,
                shipmentDateStr: '',
                deliveryDays: product.delivery_days || 7
            };
        }
        
        const shipment = warehouseShipments[product.warehouse];
        shipment.totalProducts++;
        
        if (product.is_urgent) {
            shipment.urgentCount++;
            shipment.earliestDateStr = 'СРОЧНО!';
        } else if (shipment.earliestDateStr !== 'СРОЧНО!' && 
                   product.assembly_date < shipment.earliestDate) {
            shipment.earliestDate = product.assembly_date;
            shipment.earliestDateStr = product.assembly_start;
        }
    });
    
    // Для каждого склада рассчитываем дату отгрузки (+12 дней от СЕГОДНЯ, а не от сборки)
    Object.values(warehouseShipments).forEach(shipment => {
        // ИСПРАВЛЕНО: Дата отгрузки = Сегодня + Дни доставки + 12 дней
        const shipDate = new Date(today);
        shipDate.setDate(shipDate.getDate() + shipment.deliveryDays + 12);
        shipment.shipmentDate = shipDate;
        shipment.shipmentDateStr = formatDate(shipDate);
        
        // Проверяем, не просрочена ли отгрузка
        if (shipDate < today) {
            shipment.shipmentStatus = 'overdue';
            shipment.daysToShip = 0;
        } else {
            const daysToShip = Math.ceil((shipDate - today) / (1000 * 60 * 60 * 24));
            shipment.shipmentStatus = daysToShip <= 3 ? 'urgent' : 'normal';
            shipment.daysToShip = daysToShip;
        }
    });
    
    // Сортировать по дате отгрузки (срочные первыми)
    const shipmentsList = Object.values(warehouseShipments).sort((a, b) => {
        if (a.shipmentStatus === 'overdue' && b.shipmentStatus !== 'overdue') return -1;
        if (a.shipmentStatus !== 'overdue' && b.shipmentStatus === 'overdue') return 1;
        if (a.shipmentStatus === 'urgent' && b.shipmentStatus !== 'urgent') return -1;
        if (a.shipmentStatus !== 'urgent' && b.shipmentStatus === 'urgent') return 1;
        
        if (a.shipmentDate && b.shipmentDate) {
            return a.shipmentDate - b.shipmentDate;
        }
        return 0;
    });
    
    grid.innerHTML = shipmentsList.map(shipment => {
        let cardClass = '';
        let statusBadge = '';
        
        if (shipment.shipmentStatus === 'overdue') {
            cardClass = 'urgent';
            statusBadge = '<span class="badge badge-urgent">ПРОСРОЧЕНО!</span>';
        } else if (shipment.shipmentStatus === 'urgent') {
            cardClass = 'warning';
            statusBadge = '<span class="badge badge-warning">Срочно!</span>';
        }
        
        return `
            <div class="shipment-card ${cardClass}" onclick="filterByWarehouse('${shipment.name}')">
                <h3><i class="fas fa-warehouse"></i> ${shipment.name}</h3>
                <div class="shipment-info">
                    <div class="shipment-info-row">
                        <label><i class="fas fa-calendar-alt"></i> Дата отгрузки:</label>
                        <span class="shipment-date ${shipment.shipmentStatus === 'overdue' ? 'urgent' : ''}">
                            ${shipment.shipmentDateStr || 'Не определена'}
                        </span>
                    </div>
                    ${shipment.daysToShip > 0 ? `
                    <div class="shipment-info-row">
                        <label>Дней до отгрузки:</label>
                        <strong>${shipment.daysToShip}</strong>
                    </div>
                    ` : ''}
                    ${statusBadge ? `
                    <div class="shipment-info-row">
                        <label>Статус:</label>
                        ${statusBadge}
                    </div>
                    ` : ''}
                    <div class="shipment-info-row">
                        <label><i class="fas fa-box"></i> Товаров:</label>
                        <strong>${shipment.totalProducts}</strong>
                    </div>
                    ${shipment.urgentCount > 0 ? `
                    <div class="shipment-info-row">
                        <label><i class="fas fa-exclamation-triangle"></i> Срочных:</label>
                        <strong style="color: var(--danger-color);">${shipment.urgentCount}</strong>
                    </div>
                    ` : ''}
                    <div class="shipment-info-row">
                        <label><i class="fas fa-calendar-day"></i> Ближайшая сборка:</label>
                        <span>${shipment.earliestDateStr}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== ОБЩАЯ СВОДКА ==========
function generateSummaryData() {
    if (!allProducts.length) return [];
    
    const groups = {};
    
    allProducts.forEach(product => {
        const key = `${product.seller_article}_${product.size}`;
        
        if (!groups[key]) {
            groups[key] = {
                seller_article: product.seller_article,
                name: product.name,
                size: product.size,
                brand: product.brand,
                totalSold: 0,
                totalStock: 0,
                minDaysToZero: Infinity,
                earliestAssembly: null,
                earliestAssemblyStr: '',
                hasUrgent: false,
                products: []
            };
        }
        
        groups[key].totalSold += product.sold;
        groups[key].totalStock += product.stock;
        groups[key].products.push(product);
        
        if (product.is_urgent) {
            groups[key].hasUrgent = true;
        }
        
        if (product.days_to_zero < groups[key].minDaysToZero) {
            groups[key].minDaysToZero = product.days_to_zero;
        }
        
        if (product.assembly_date && 
            (!groups[key].earliestAssembly || product.assembly_date < groups[key].earliestAssembly)) {
            groups[key].earliestAssembly = product.assembly_date;
            groups[key].earliestAssemblyStr = product.assembly_start;
        }
    });
    
    return Object.values(groups).map(group => {
        const salesPerDay = group.totalSold / 30;
        const needed45 = Math.ceil(salesPerDay * 45);
        
        // Определяем статус
        let status = 'Нормально';
        let statusClass = 'badge-success';
        
        if (group.hasUrgent) {
            status = 'Критично';
            statusClass = 'badge-urgent';
        } else if (group.minDaysToZero < 14) {
            status = 'Внимание';
            statusClass = 'badge-warning';
        }
        
        // Определяем класс строки по остатку
        let rowClass = '';
        const coverageDays = group.totalStock / salesPerDay;
        if (coverageDays < 14) {
            rowClass = 'urgent';
        } else if (coverageDays < 30) {
            rowClass = 'warning';
        } else {
            rowClass = 'success';
        }
        
        return {
            ...group,
            salesPerDay: salesPerDay.toFixed(2),
            needed45: needed45,
            salesPerDayNum: salesPerDay,
            coverageDays: coverageDays,
            status: status,
            statusClass: statusClass,
            rowClass: rowClass
        };
    });
}

function displaySummary() {
    const tbody = document.getElementById('summaryTableBody');
    if (!tbody) return;
    
    if (allProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>Нет данных</h3>
                    <p>Загрузите файл с данными на главной странице</p>
                </td>
            </tr>
        `;
        return;
    }
    
    let summaryData = generateSummaryData();
    
    // Применяем фильтры
    const searchTerm = document.getElementById('summarySearchInput')?.value?.toLowerCase() || '';
    const sizeFilter = document.getElementById('sizeFilter')?.value || '';
    const sortOption = document.getElementById('summarySort')?.value || 'stock_asc';
    
    if (searchTerm) {
        summaryData = summaryData.filter(item => 
            item.seller_article?.toLowerCase().includes(searchTerm) ||
            item.name?.toLowerCase().includes(searchTerm) ||
            item.brand?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (sizeFilter) {
        summaryData = summaryData.filter(item => item.size === sizeFilter);
    }
    
    // Сортировка
    summaryData.sort((a, b) => {
        switch (sortOption) {
            case 'stock_asc':
                return a.totalStock - b.totalStock;
            case 'stock_desc':
                return b.totalStock - a.totalStock;
            case 'name':
                return (a.name || '').localeCompare(b.name || '');
            case 'urgent':
                if (a.hasUrgent && !b.hasUrgent) return -1;
                if (!a.hasUrgent && b.hasUrgent) return 1;
                return (a.minDaysToZero || 999) - (b.minDaysToZero || 999);
            default:
                return 0;
        }
    });
    
    tbody.innerHTML = summaryData.map(item => {
        // Определяем цвет даты запуска
        let dateClass = 'normal-date';
        if (item.earliestAssemblyStr === 'СРОЧНО!') {
            dateClass = 'urgent-date';
        } else if (item.earliestAssembly) {
            const daysDiff = Math.ceil((item.earliestAssembly - new Date()) / (1000 * 60 * 60 * 24));
            if (daysDiff < 0) {
                dateClass = 'urgent-date';
            } else if (daysDiff < 14) {
                dateClass = 'warning-date';
            }
        }
        
        return `
            <tr class="${item.rowClass}" onclick="filterByArticle('${item.seller_article}')" style="cursor: pointer;">
                <td><strong>${item.seller_article || ''}</strong></td>
                <td>${item.name || ''}</td>
                <td>${item.size || ''}</td>
                <td>${item.brand || ''}</td>
                <td class="stat-number">${item.totalSold}</td>
                <td class="stat-number"><strong>${item.totalStock}</strong></td>
                <td class="stat-number">${item.salesPerDay}</td>
                <td class="stat-number">${item.needed45}</td>
                <td class="${dateClass}">${item.earliestAssemblyStr || ''}</td>
                <td><span class="badge ${item.statusClass}">${item.status}</span></td>
            </tr>
        `;
    }).join('');
    
    updateSummaryResultsCount(summaryData.length);
    
    // Показываем подсказку прокрутки
    showScrollHint('summaryTable');
    
    // Обновляем скроллбары
    setTimeout(() => {
        forceHorizontalScroll();
    }, 200);
}

function updateSummaryResultsCount(count) {
    let counter = document.getElementById('summaryResultsCounter');
    if (!counter) {
        counter = document.createElement('div');
        counter.id = 'summaryResultsCounter';
        counter.className = 'results-counter';
        const filtersSection = document.querySelector('.filters-section');
        if (filtersSection) {
            filtersSection.appendChild(counter);
        }
    }
    counter.innerHTML = `<i class="fas fa-box"></i> Всего позиций: ${count}`;
}

function filterSummary() {
    displaySummary();
}

function filterByArticle(article) {
    if (!article) return;
    
    // Устанавливаем фильтр по артикулу на странице товаров
    const articleFilter = document.getElementById('articleFilter');
    if (articleFilter) {
        articleFilter.value = article;
    }
    
    // Очищаем фильтр по складу
    const warehouseFilter = document.getElementById('warehouseFilter');
    if (warehouseFilter) {
        warehouseFilter.value = '';
    }
    
    // Переходим на страницу товаров
    showPage('products');
    displayProducts();
}

// ========== ПОДСКАЗКА ПРОКРУТКИ ==========
function showScrollHint(tableId) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const container = table.closest('.table-container');
    if (!container) return;
    
    // Проверяем, нужна ли прокрутка
    if (table.scrollWidth <= container.clientWidth) return;
    
    // Удаляем старую подсказку если есть
    const oldHint = container.parentNode.querySelector('.scroll-hint');
    if (oldHint) oldHint.remove();
    
    // Создаем новую подсказку
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.innerHTML = `
        <i class="fas fa-arrow-left"></i>
        <span>Прокрутите → для просмотра всех колонок</span>
        <i class="fas fa-arrow-right"></i>
    `;
    
    // Вставляем после контейнера
    container.parentNode.insertBefore(hint, container.nextSibling);
    
    // Показываем подсказку
    hint.style.display = 'flex';
    
    // Добавляем обработчик прокрутки для скрытия подсказки
    const hideHint = () => {
        hint.style.opacity = '0';
        setTimeout(() => {
            hint.style.display = 'none';
            container.removeEventListener('scroll', hideHint);
        }, 500);
    };
    
    container.addEventListener('scroll', hideHint, { once: true });
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        if (hint.style.display !== 'none') {
            hint.style.opacity = '0';
            setTimeout(() => {
                hint.style.display = 'none';
            }, 500);
        }
    }, 5000);
}

// ========== ПРИНУДИТЕЛЬНОЕ ОТОБРАЖЕНИЕ СКРОЛЛБАРА ==========
function forceHorizontalScroll() {
    console.log('🔄 Принудительная активация скроллбаров...');
    
    const tables = [
        { id: 'productsTable', minWidth: '2000px' },
        { id: 'summaryTable', minWidth: '1500px' }
    ];
    
    tables.forEach(table => {
        const tableElement = document.getElementById(table.id);
        if (!tableElement) return;
        
        const container = tableElement.closest('.table-container');
        if (!container) return;
        
        // Принудительно устанавливаем минимальную ширину
        tableElement.style.minWidth = table.minWidth;
        tableElement.style.width = '100%';
        
        // Принудительно включаем скролл
        container.style.overflowX = 'scroll';
        container.style.overflowY = 'hidden';
        container.style.webkitOverflowScrolling = 'touch';
        
        console.log(`✅ Скроллбар для ${table.id} активирован: ${tableElement.scrollWidth}px > ${container.clientWidth}px`);
    });
}

// ========== РЕДАКТИРОВАНИЕ СКЛАДОВ ==========
function editWarehouse(warehouseId) {
    console.log('🖱️ Нажата кнопка редактирования склада с ID:', warehouseId);
    
    // Ищем склад по ID
    const warehouse = allWarehouses.find(w => w.id === warehouseId);
    
    if (!warehouse) {
        console.error('❌ Склад не найден! ID:', warehouseId);
        alert('Ошибка: склад не найден');
        return;
    }
    
    console.log('✅ Найден склад:', warehouse);
    
    // Заполняем поля в модальном окне
    const idField = document.getElementById('editWarehouseId');
    const nameField = document.getElementById('editWarehouseName');
    const daysField = document.getElementById('editDeliveryDays');
    const factoryInfo = document.getElementById('factorySourceInfo');
    const factoryValue = document.getElementById('factoryValue');
    
    if (idField && nameField && daysField) {
        idField.value = warehouse.id;
        nameField.value = warehouse.name;
        daysField.value = warehouse.delivery_days;
        
        // Показываем заводское значение если есть
        if (factoryDeliveryDays[warehouse.name]) {
            factoryInfo.style.display = 'block';
            factoryValue.textContent = factoryDeliveryDays[warehouse.name] + ' дн.';
        } else {
            factoryInfo.style.display = 'none';
        }
        
        console.log('📝 Поля заполнены:', {
            id: idField.value,
            name: nameField.value,
            days: daysField.value
        });
        
        // Показываем модальное окно
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.style.display = 'block';
            console.log('🪟 Модальное окно открыто');
        } else {
            console.error('❌ Модальное окно не найдено!');
        }
    } else {
        console.error('❌ Поля формы не найдены!', {
            idField: !!idField,
            nameField: !!nameField,
            daysField: !!daysField
        });
    }
}

function resetToFactory() {
    const id = document.getElementById('editWarehouseId')?.value;
    const warehouse = allWarehouses.find(w => w.id === id);
    
    if (warehouse && factoryDeliveryDays[warehouse.name]) {
        document.getElementById('editDeliveryDays').value = factoryDeliveryDays[warehouse.name];
        alert(`✅ Значение сброшено к заводскому: ${factoryDeliveryDays[warehouse.name]} дн.`);
    }
}

function saveWarehouse(event) {
    if (event) {
        event.preventDefault();
        console.log('💾 Форма отправлена');
    }
    
    // Получаем значения из полей
    const id = document.getElementById('editWarehouseId')?.value;
    const name = document.getElementById('editWarehouseName')?.value;
    const deliveryDays = Number(document.getElementById('editDeliveryDays')?.value);
    
    console.log('📦 Сохраняем склад:', { id, name, deliveryDays });
    
    // Валидация
    if (!id) {
        alert('Ошибка: ID склада не найден');
        return;
    }
    
    if (isNaN(deliveryDays) || deliveryDays < 0) {
        alert('Пожалуйста, введите корректное количество дней (положительное число)');
        return;
    }
    
    if (deliveryDays > 30) {
        if (!confirm('Вы уверены, что доставка занимает больше 30 дней?')) {
            return;
        }
    }
    
    // Найти индекс склада
    const warehouseIndex = allWarehouses.findIndex(w => w.id === id);
    
    if (warehouseIndex === -1) {
        console.error('❌ Склад не найден в массиве! ID:', id);
        alert('Ошибка: склад не найден');
        return;
    }
    
    // Сохраняем старое значение
    const oldDeliveryDays = allWarehouses[warehouseIndex].delivery_days;
    
    // Обновляем склад
    allWarehouses[warehouseIndex].delivery_days = deliveryDays;
    allWarehouses[warehouseIndex].source = 'edited'; // Помечаем как измененное вручную
    
    console.log(`✅ Склад обновлен: ${name}, дни доставки: ${oldDeliveryDays} → ${deliveryDays}`);
    
    // Сохраняем склады в localStorage
    saveWarehousesToStorage();
    
    // Пересчитываем ВСЕ товары
    console.log('🔄 Пересчет всех товаров...');
    const startTime = performance.now();
    
    allProducts = allProducts.map(product => {
        if (product.warehouse === name) {
            return calculateProductFields(product);
        }
        return product;
    });
    
    const endTime = performance.now();
    console.log(`✅ Товары пересчитаны за ${Math.round(endTime - startTime)}мс`);
    
    // Сохраняем товары в localStorage
    saveProductsToStorage();
    
    // Обновляем все представления
    displayWarehouses();
    displayProducts();
    loadShipments();
    displaySummary();
    updateWarehouseFilter();
    updateArticleFilter();
    
    // Закрываем модальное окно
    closeEditModal();
    
    alert(`✅ Склад "${name}" обновлен!\nДни доставки: ${oldDeliveryDays} → ${deliveryDays}`);
}

function closeEditModal() {
    console.log('🚪 Закрытие модального окна');
    const modal = document.getElementById('editModal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('❌ Модальное окно не найдено при закрытии');
    }
}

// ========== СТАТИСТИКА ==========
function updateStats() {
    const statsSection = document.getElementById('statsSection');
    if (!statsSection) return;
    
    if (allProducts.length > 0) {
        statsSection.style.display = 'grid';
        
        const urgentProducts = allProducts.filter(p => p.is_urgent).length;
        
        document.getElementById('totalProducts').textContent = allProducts.length;
        document.getElementById('totalWarehouses').textContent = allWarehouses.length;
        document.getElementById('urgentProducts').textContent = urgentProducts;
    } else {
        statsSection.style.display = 'none';
    }
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeEditModal();
    }
}