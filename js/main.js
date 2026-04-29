/* === js/main.js === */

const App = {
    history: ['scr-main'],

    init: function() {
        // Скрываем абсолютно все экраны при старте
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        
        // Показываем только главный экран
        this.navTo('main');
        
        // Запускаем проверку полей (для кнопки Save)
        this.bindInputs();
    },

    navTo: function(id) {
        // Скрываем текущий активный экран
        document.querySelectorAll('.screen').forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
        });

        // Находим целевой экран по ID (добавляя 'scr-' если нужно)
        const targetId = id.startsWith('scr-') ? id : 'scr-' + id;
        const target = document.getElementById(targetId);
        
        if (target) {
            target.style.display = 'block';
            target.classList.add('active');
            
            // Управление нижним меню: скрываем в генераторах и сканере
            const nav = document.getElementById('bottom-nav');
            if (nav) {
                if (id.includes('gen') || id.includes('scan')) {
                    nav.style.display = 'none';
                } else {
                    nav.style.display = 'flex';
                }
            }
            
            // Управление кнопкой назад
            const backBtn = document.getElementById('btn-back');
            if (backBtn) {
                backBtn.style.visibility = (targetId === 'scr-main') ? 'hidden' : 'visible';
            }

            // Запись в историю (для корректной работы "Назад")
            if (this.history[this.history.length - 1] !== targetId) {
                this.history.push(targetId);
            }
        } else {
            console.error('Экран не найден:', targetId);
        }
    },

    navBack: function() {
        if (this.history.length > 1) {
            this.history.pop(); // Удаляем текущий
            const prev = this.history[this.history.length - 1];
            this.navTo(prev); // Переходим на предыдущий
        } else {
            this.navTo('main');
        }
    },

    // Проверка активности кнопки Save (для 3D режима)
    checkSaveState: function() {
        const btn3D = document.getElementById('btn-save-3d');
        const screen3D = document.getElementById('scr-gen-3d');

        if (screen3D && screen3D.classList.contains('active')) {
            const r = document.getElementById('input-r').value;
            const g = document.getElementById('input-g').value;
            const b = document.getElementById('input-b').value;
            if(btn3D) btn3D.disabled = !(r && g && b);
        }
    },

    bindInputs: function() {
        const inputs = ['input-r', 'input-g', 'input-b', 'input-ornament'];
        inputs.forEach(id => {
            const el = document.getElementById(id);
            if(el) el.addEventListener('input', () => this.checkSaveState());
        });
    }
};

// --- SCANNER ENGINE ---

const ScannerEngine = {
    handleFile: function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        
        reader.onload = function(ev) {
            const img = new Image();
            
            img.onload = function() {
                // Создаем скрытый canvas для декодирования
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Получаем данные изображения
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                
                // Запускаем jsQR
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if (code) {
                    // ВАЖНО: Показываем результат
                    const resDiv = document.getElementById('scan-results');
                    if (resDiv) resDiv.innerText = code.data;

                    // Переходим на экран результата/выбора
                    App.navTo('scan-choice');
                } else {
                    alert("QR-код не найден на изображении.");
                }
            };
            
            img.src = ev.target.result;
        };
        
        reader.readAsDataURL(file);
    }
};

// Запуск приложения
window.onload = () => App.init();
