/* === js/main.js === */

const App = {
    current: 'main', // Текущий экран
    history: ['main'], // История навигации

    // 1. Инициализация при загрузке
    init: function() {
        // Добавляем класс active только экрану scr-main
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        document.getElementById('scr-main').classList.add('active');
        
        // Скрываем стрелку "Назад" на главном экране
        document.getElementById('btn-back').style.visibility = 'hidden';
        
        // Запускаем проверку кнопки Save (если применимо)
        this.checkSaveState();
    },

    // 2. Навигация к экрану
    navTo: function(screenId) {
        // Снимаем active со всех экранов
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));

        // Вешаем active на нужный экран
        const target = document.getElementById(screenId);
        if (target) {
            target.classList.add('active');
        }

        // Управление историей
        if (screenId !== this.current) {
            this.history.push(this.current);
            this.current = screenId;
        }

        // Показываем стрелку "Назад", если мы не на главном
        document.getElementById('btn-back').style.visibility = 
            (screenId === 'scr-main') ? 'hidden' : 'visible';

        // Проверяем состояние кнопок при переходе
        this.checkSaveState();
    },

    // 3. Кнопка "Назад"
    navBack: function() {
        if (this.history.length <= 1) {
            // Если истории нет, идем на главную
            this.navTo('scr-main');
            return;
        }

        // Удаляем текущий экран из истории
        this.history.pop();
        // Берем предыдущий
        const prev = this.history[this.history.length - 1];
        
        // Навигируем назад
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));
        
        const target = document.getElementById(prev);
        if (target) {
            target.classList.add('active');
            this.current = prev;
        }

        // Скрываем стрелку на главном
        document.getElementById('btn-back').style.visibility = 
            (prev === 'scr-main') ? 'hidden' : 'visible';
    },

    // 4. Проверка активности кнопки Save
    checkSaveState: function() {
        // Логика для 3D режима
        const saveBtn3D = document.getElementById('btn-save-3d');
        const screen3D = document.getElementById('scr-gen-3d');

        // Если мы на экране 3D
        if (screen3D && screen3D.classList.contains('active')) {
            const valR = document.getElementById('input-r').value;
            const valG = document.getElementById('input-g').value;
            const valB = document.getElementById('input-b').value;

            // Активна только если все 3 поля заполнены
            if(saveBtn3D) {
                saveBtn3D.disabled = !(valR && valG && valB);
            }
        }

        // Логика для Ornament режима (если нужно)
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

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Слушатели ввода для проверки кнопки Save (оптимизация)
document.addEventListener('input', (e) => {
    if (e.target.id === 'input-r' || e.target.id === 'input-g' || e.target.id === 'input-b') {
        App.checkSaveState();
    }
    if (e.target.id === 'input-ornament') {
        App.checkSaveState();
    }
});
