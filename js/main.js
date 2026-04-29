/* === js/main.js (Исправленная версия) === */

const App = {
    current: 'scr-main', // Текущий экран (хранится полный ID)
    history: ['scr-main'], // История навигации

    // 1. Инициализация при загрузке
    init: function() {
        // Скрытие всех экранов и показ только main
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        const mainScreen = document.getElementById('scr-main');
        if (mainScreen) mainScreen.classList.add('active');
        
        // Скрытие стрелки назад
        const backBtn = document.getElementById('btn-back');
        if(backBtn) backBtn.style.visibility = 'hidden';
        
        // Начальное состояние меню
        this.toggleBottomNav('main');
        
        // Проверка кнопок
        this.checkSaveState();
    },

    // Вспомогательная функция для управления нижним меню
    toggleBottomNav: function(screenId) {
        const nav = document.getElementById('bottom-nav'); // Исправленный ID
        if (!nav) return;

        // Скрываем, если в ID есть 'gen' или 'create'
        if (screenId.includes('gen') || screenId.includes('create')) {
            nav.style.display = 'none';
        } else {
            nav.style.display = 'flex'; // Восстанавливаем, если это не режим генерации
        }
    },

    // 2. Навигация к экрану
    navTo: function(screenId) {
        // --- ИСПРАВЛЕНИЕ 1: Авто-добавление приставки scr- ---
        let targetId = screenId;
        if (!screenId.startsWith('scr-')) {
            targetId = 'scr-' + screenId;
        }

        // Снимаем active со всех экранов
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

        // Вешаем active на целевой экран
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.add('active');
        } else {
            console.error('Экран не найден:', targetId);
            return;
        }

        // Управление историей
        if (targetId !== this.current) {
            this.history.push(this.current);
            this.current = targetId;
        }

        // Управление стрелкой "Назад"
        const backBtn = document.getElementById('btn-back');
        if (backBtn) {
            backBtn.style.visibility = (targetId === 'scr-main') ? 'hidden' : 'visible';
        }

        // --- ИСПРАВЛЕНИЕ 2 И 3: Принудительное скрытие меню ---
        // Вызываем функцию скрытия для текущего screenId
        this.toggleBottomNav(screenId); // Передаем исходный ID для проверки ключевых слов

        this.checkSaveState();
    },

    // 3. Кнопка "Назад"
    navBack: function() {
        // Если история пуста или в ней только главный экран
        if (this.history.length <= 1) {
            this.navTo('main'); // Гарантированный возврат на главный
            this.history = ['scr-main']; // Сброс истории
            return;
        }

        // Удаляем текущий экран из истории
        this.history.pop();
        // Получаем предыдущий
        const prev = this.history[this.history.length - 1];
        
        // Навигация
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        const target = document.getElementById(prev);
        if (target) {
            target.classList.add('active');
            this.current = prev;

            // Обновляем видимость стрелки
            const backBtn = document.getElementById('btn-back');
            if (backBtn) {
                backBtn.style.visibility = (prev === 'scr-main') ? 'hidden' : 'visible';
            }

            // Восстанавливаем меню, если мы ушли с экранов генерации
            this.toggleBottomNav(prev);
        } else {
            // Fallback на случай ошибки
            this.navTo('main');
        }
    },

    // 4. Логика кнопки Save
    checkSaveState: function() {
        // Проверка для 3D режима
        const saveBtn3D = document.getElementById('btn-save-3d');
        const screen3D = document.getElementById('scr-gen-3d');

        if (screen3D && screen3D.classList.contains('active')) {
            const valR = document.getElementById('input-r').value;
            const valG = document.getElementById('input-g').value;
            const valB = document.getElementById('input-b').value;

            if(saveBtn3D) {
                saveBtn3D.disabled = !(valR && valG && valB);
            }
        }

        // Проверка для Ornament режима
        const saveBtnOrn = document.getElementById('btn-save-orn');
        const screenOrn = document.getElementById('scr-gen-ornament');

        if (screenOrn && screenOrn.classList.contains('active')) {
            const valText = document.getElementById('input-ornament').value;
            if(saveBtnOrn) {
                saveBtnOrn.disabled = !valText;
            }
        }
    }
};

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Слушатели ввода
document.addEventListener('input', (e) => {
    if (e.target.id === 'input-r' || e.target.id === 'input-g' || e.target.id === 'input-b' || e.target.id === 'input-ornament') {
        App.checkSaveState();
    }
});
