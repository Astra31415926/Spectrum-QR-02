/* === js/main.js === */

// --- 1. NAVIGATION & APP LOGIC ---

const App = {
    current: 'scr-main', // Храним полный ID текущего экрана
    history: ['scr-main'],

    // Инициализация при запуске
    init: function() {
        // Принудительный переход на главный экран при старте
        this.navTo('main'); 
        
        // Инициализация сканера (привязка элементов)
        ScannerEngine.init();
        
        // Навешиваем слушатели на инпуты для проверки кнопки Save
        this.bindInputListeners();
    },

    // Навигация к экрану
    navTo: function(screenId) {
        // 1. Авто-добавление приставки scr-
        let targetId = screenId;
        if (!screenId.startsWith('scr-')) {
            targetId = 'scr-' + screenId;
        }

        // 2. Скрываем ВСЕ экраны (класс .screen)
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));

        // 3. Показываем только целевой экран
        const targetScreen = document.getElementById(targetId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.current = targetId;
            
            // Добавляем в историю (если это не повторный переход)
            if (this.history[this.history.length - 1] !== targetId) {
                this.history.push(targetId);
            }
        } else {
            console.error('Экран не найден:', targetId);
            return;
        }

        // 4. Управление кнопкой "Назад"
        const backBtn = document.getElementById('btn-back');
        if (backBtn) {
            backBtn.style.visibility = (targetId === 'scr-main') ? 'hidden' : 'visible';
        }

        // 5. Управление нижним меню (bottom-nav)
        // Скрываем, если в ID есть "gen" или "scan"
        const bottomNav = document.getElementById('bottom-nav');
        if (bottomNav) {
            if (targetId.includes('gen') || targetId.includes('scan')) {
                bottomNav.style.display = 'none';
            } else {
                bottomNav.style.display = 'flex';
            }
        }

        // 6. Проверка состояния кнопок сохранения
        this.checkSaveState();
    },

    // Кнопка "Назад"
    navBack: function() {
        if (this.history.length <= 1) {
            this.navTo('main');
            this.history = ['scr-main']; // Сброс истории
            return;
        }

        // Удаляем текущий экран из истории
        this.history.pop();
        // Получаем предыдущий
        const prev = this.history[this.history.length - 1];
        
        // Навигация (без записи в историю)
        const screens = document.querySelectorAll('.screen');
        screens.forEach(s => s.classList.remove('active'));
        
        const target = document.getElementById(prev);
        if (target) {
            target.classList.add('active');
            this.current = prev;

            // Обновляем UI
            const backBtn = document.getElementById('btn-back');
            if (backBtn) backBtn.style.visibility = (prev === 'scr-main') ? 'hidden' : 'visible';

            const bottomNav = document.getElementById('bottom-nav');
            if (bottomNav) {
                 if (prev.includes('gen') || prev.includes('scan')) {
                    bottomNav.style.display = 'none';
                } else {
                    bottomNav.style.display = 'flex';
                }
            }
        }
    },

    // Проверка активности кнопки Save (для 3D и Ornament)
    checkSaveState: function() {
        // Логика для 3D
        const saveBtn3D = document.getElementById('btn-save-3d');
        if (document.getElementById('scr-gen-3d').classList.contains('active')) {
            const r = document.getElementById('input-r').value;
            const g = document.getElementById('input-g').value;
            const b = document.getElementById('input-b').value;
            if(saveBtn3D) saveBtn3D.disabled = !(r && g && b);
        }

        // Логика для Ornament
        const saveBtnOrn = document.getElementById('btn-save-orn');
        if (document.getElementById('scr-gen-ornament').classList.contains('active')) {
            const val = document.getElementById('input-ornament').value;
            if(saveBtnOrn) saveBtnOrn.disabled = !val;
        }
    },

    bindInputListeners: function() {
        // Слушатели для проверки кнопки Save при вводе
        const inputs3D = ['input-r', 'input-g', 'input-b'];
        inputs3D.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', () => this.checkSaveState());
        });

        const inputOrn = document.getElementById('input-ornament');
        if(inputOrn) inputOrn.addEventListener('input', () => this.checkSaveState());
    }
};

// --- 2. SCANNER LOGIC ---

const ScannerEngine = {
    els: {},
    
    init: function() {
        this.els = {
            overlay: document.getElementById('scanner-overlay'),
            video: document.getElementById('video-feed'),
            freeze: document.getElementById('freeze-frame'),
            results: document.getElementById('scan-results'),
            flash: document.getElementById('flash-fx')
        };
    },

    // Запуск камеры
    startCamera: async function() {
        // Открываем оверлей сканера
        if(this.els.overlay) this.els.overlay.style.display = 'flex';
        
        // Навигация на "скрытый" экран сканирования, чтобы скрыть меню
        App.navTo('scan-active'); 

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            if(this.els.video) {
                this.els.video.srcObject = stream;
                this.els.video.play();
            }
        } catch(e) {
            alert("Camera Error: " + e);
            this.close();
        }
    },

    // Обработка файла (Gallery)
    handleFile: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                // Создаем временный canvas для сканирования
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Ограничиваем размер для производительности
                const maxSize = 1024;
                let w = img.width;
                let h = img.height;
                if (w > maxSize || h > maxSize) {
                    const ratio = Math.min(maxSize / w, maxSize / h);
                    w *= ratio;
                    h *= ratio;
                }
                
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);

                // Получаем данные для jsQR
                const imageData = ctx.getImageData(0, 0, w, h);
                
                // Сканируем
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert"
                });

                // Обработка результата
                if (code) {
                    this.showResult(code.data);
                } else {
                    alert("QR-код не найден на изображении.");
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    },

    showResult: function(text) {
        // Показываем результат в UI
        if(this.els.results) {
            this.els.results.innerText = text;
        }

        // Визуальный фидбек
        if(this.els.flash) {
            this.els.flash.classList.add('active');
            setTimeout(() => this.els.flash.classList.remove('active'), 200);
        }

        // КРИТИЧЕСКИ ВАЖНО: Переход на экран результата/выбора
        // Мы показываем оверлей с результатом и меняем фон на scan-choice
        if(this.els.overlay) this.els.overlay.style.display = 'flex';
        
        // Навигация на scr-scan-choice (как требует ТЗ)
        // Это скроет меню, так как в ID есть "scan"
        App.navTo('scan-choice');
    },

    close: function() {
        if(this.els.video && this.els.video.srcObject) {
            this.els.video.srcObject.getTracks().forEach(track => track.stop());
        }
        if(this.els.overlay) this.els.overlay.style.display = 'none';
        App.navTo('main');
    }
};

// --- BOOTSTRAP ---

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
