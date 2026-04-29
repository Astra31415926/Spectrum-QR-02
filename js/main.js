/* === js/main.js === */

const App = {
    history: ['scr-main'],

    init: function() {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        this.navTo('main');
        this.bindInputs();
    },

    navTo: function(id) {
        // 1. Скрываем ВСЕ экраны принудительно
        document.querySelectorAll('.screen').forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
        });

        // 2. Определяем ID
        const targetId = id.startsWith('scr-') ? id : 'scr-' + id;
        const target = document.getElementById(targetId);
        
        if (target) {
            // 3. Показываем нужный (flex для генераторов, block для остальных)
            if (targetId.includes('gen')) {
                target.style.display = 'flex';
            } else {
                target.style.display = 'block';
            }
            target.classList.add('active');
            
            // 4. Управление нижним меню
            const nav = document.getElementById('bottom-nav');
            if (nav) {
                if (targetId.includes('gen') || targetId.includes('scan')) {
                    nav.style.display = 'none';
                } else {
                    nav.style.display = 'flex';
                }
            }
            
            // 5. Кнопка "Назад"
            const backBtn = document.getElementById('btn-back');
            if (backBtn) {
                backBtn.style.visibility = (targetId === 'scr-main') ? 'hidden' : 'visible';
            }
        }
    },

    navBack: function() {
        if (this.history.length > 1) {
            this.history.pop();
            const prev = this.history[this.history.length - 1];
            this.navTo(prev);
        } else {
            this.navTo('main');
        }
    },

    goHome: function() {
        this.history = ['scr-main'];
        this.navTo('main');
    },

    toggleMenu: function() {
        const menu = document.getElementById('menu-overlay');
        if(menu) menu.classList.toggle('hidden');
    },

    saveImage: function(mode) {
        const canvas = document.getElementById('canvas-' + mode);
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'Spectrum-QR.png';
        link.href = canvas.toDataURL();
        link.click();
    },

    checkSaveState: function() {
        const btn3D = document.getElementById('btn-save-3d');
        const screen3D = document.getElementById('scr-gen-3d');
        if (screen3D && screen3D.classList.contains('active')) {
            const r = document.getElementById('input-r').value;
            const g = document.getElementById('input-g').value;
            const b = document.getElementById('input-b').value;
            if(btn3D) btn3D.disabled = !(r && g && b);
        }
        
        const btnOrn = document.getElementById('btn-save-orn');
        const screenOrn = document.getElementById('scr-gen-ornament');
        if (screenOrn && screenOrn.classList.contains('active')) {
            const val = document.getElementById('input-ornament').value;
            if(btnOrn) btnOrn.disabled = !val;
        }
    },

    bindInputs: function() {
        ['input-r', 'input-g', 'input-b', 'input-ornament'].forEach(id => {
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

        // Проверка библиотеки
        if (typeof jsQR === 'undefined') {
            alert("Ошибка: Библиотека jsQR не загружена.");
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(ev) {
            const img = new Image();
            
            img.onload = function() {
                try {
                    // === ОПТИМИЗАЦИЯ КАЧЕСТВА СКАНИРОВАНИЯ ===
                    // Создаем canvas нужного размера
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Ограничиваем размер, чтобы не тормозило
                    // jsQR лучше работает с изображениями до ~800px
                    const MAX_SIZE = 800;
                    let w = img.width;
                    let h = img.height;
                    
                    if (w > h && w > MAX_SIZE) {
                        h = Math.round(h * MAX_SIZE / w);
                        w = MAX_SIZE;
                    } else if (h > MAX_SIZE) {
                        w = Math.round(w * MAX_SIZE / h);
                        h = MAX_SIZE;
                    }
                    
                    canvas.width = w;
                    canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    
                    const imageData = ctx.getImageData(0, 0, w, h);
                    
                    // Попытка декодирования
                    const code = jsQR(imageData.data, imageData.width, imageData.height, {
                        inversionAttempts: "attemptBoth" // Пробуем и инвертированные цвета
                    });
                    
                    if (code && code.data) {
                        // УСПЕХ: Выводим результат
                        alert("Успех! Результат: " + code.data);
                        
                        // Обновляем UI
                        let resDiv = document.getElementById('scan-results');
                        if(resDiv) resDiv.innerText = code.data;
                        
                        // Переходим на экран результата
                        App.navTo('scan-choice');

                    } else {
                        // ОШИБКА: Код не найден
                        alert("QR not found, try another image.\n(Попробуйте другое, более четкое фото)");
                    }
                } catch (e) {
                    console.error(e);
                    alert("Ошибка обработки изображения.");
                }
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    },
    
    startCamera: function() {
        // Заглушка камеры
        alert("Функция камеры в разработке. Используйте кнопку 'Gallery'.");
    }
};

// Запуск
window.onload = () => App.init();
