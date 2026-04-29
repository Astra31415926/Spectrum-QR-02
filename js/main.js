/* js/main.js */

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// --- UI & State Management ---
const App = {
    current: 'main',
    history: ['main'],
    
    init: function() {
        // Preload engines
        OrnamentEngine.handleInput();
        Engine3D.handleInput();
    },

    navTo: function(id) {
        this.history.push(this.current);
        this.updateScreen(id);
    },

    navBack: function() {
        if (this.history.length <= 1) return;
        const prev = this.history.pop();
        this.updateScreen(prev);
    },

    goHome: function() {
        this.history = ['main'];
        this.updateScreen('main');
    },

    updateScreen: function(id) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        
        // Show target
        const target = document.getElementById('scr-' + id);
        if(target) target.classList.add('active');
        this.current = id;

        // Header Back Button
        document.getElementById('btn-back').style.visibility = (id === 'main') ? 'hidden' : 'visible';

        // Bottom Nav Logic: Hide if in Generator modes
        const bottomNav = document.getElementById('bottom-nav');
        if (id === 'gen-ornament' || id === 'gen-3d') {
            document.getElementById('app').classList.add('generator-active');
        } else {
            document.getElementById('app').classList.remove('generator-active');
        }
    },

    toggleMenu: function() {
        document.getElementById('menu-overlay').classList.toggle('hidden');
    },

    // Save Logic: Direct download, no popup
    saveImage: function(mode) {
        const canvas = mode === 'ornament' ? 
            document.getElementById('canvas-ornament') : 
            document.getElementById('canvas-3d');
        
        // Check if empty
        const inputId = mode === 'ornament' ? 'input-ornament' : 'input-r';
        if (!document.getElementById(inputId).value) return;

        const link = document.createElement('a');
        link.download = `Spectrum-QR_${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
};

// --- Scanner Logic ---
const ScannerEngine = {
    state: { scanning: false, locked: {r:false,g:false,b:false}, results:{r:null,g:null,b:null} },
    els: {},
    
    init: function() {
        this.els = {
            viewport: document.getElementById('scan-viewport'),
            video: document.getElementById('video-feed'),
            freeze: document.getElementById('freeze-frame'),
            fCtx: document.getElementById('freeze-frame').getContext('2d', { willReadFrequently: true }),
            canvas: document.getElementById('canvas-3d'), // reused for processing
            ctx: document.getElementById('canvas-3d').getContext('2d', { willReadFrequently: true }),
            resultsBox: document.getElementById('scan-results'),
            flash: document.getElementById('flash-fx'),
            viewfinder: document.getElementById('viewfinder-corners')
        };
    },

    // Triggered by "Camera" button in Scan Choice screen
    startCamera: async function() {
        // Navigate to scanner overlay
        App.navTo('scanner-active'); // dummy nav to hide previous screen
        document.getElementById('scanner-overlay').style.display = 'flex';
        
        if(!this.els.video) this.init();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            this.els.video.srcObject = stream;
            this.els.video.play();
            this.els.video.style.display = 'block';
            this.els.freeze.style.display = 'none';
            
            this.state.scanning = true;
            this.processLoop();
        } catch(e) { 
            alert("Camera Error: " + e); 
            this.close();
        }
    },

    // Triggered by "Gallery" button
    handleFile: function(e) {
        const file = e.target.files[0]; 
        if(!file) return;

        if(!this.els.freeze) this.init();

        // Navigate to scanner overlay
        document.getElementById('scanner-overlay').style.display = 'flex';
        
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                this.els.freeze.width = 512; 
                this.els.freeze.height = 512;
                const s = Math.min(img.width, img.height);
                const sx = (img.width - s)/2, sy = (img.height - s)/2;
                this.els.fCtx.drawImage(img, sx, sy, s, s, 0, 0, 512, 512);
                
                this.els.freeze.style.display = 'block';
                this.els.video.style.display = 'none';

                this.state.scanning = true;
                this.processLoop();
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
    },

    close: function() {
        this.state.scanning = false;
        if(this.els.video && this.els.video.srcObject) {
            this.els.video.srcObject.getTracks().forEach(t => t.stop());
        }
        document.getElementById('scanner-overlay').style.display = 'none';
        this.reset();
    },

    reset: function() {
        this.state = { scanning: false, locked: {r:false,g:false,b:false}, results:{r:null,g:null,b:null} };
        if(this.els.resultsBox) this.els.resultsBox.innerHTML = '';
    },

    // Core Loop (Hybrid Logic)
    processLoop: function() {
        if (!this.state.scanning) return;

        let sourceData = null;
        
        if (this.els.video.style.display !== 'none' && this.els.video.readyState >= 2) {
            this.els.ctx.drawImage(this.els.video, 0, 0, 512, 512);
            sourceData = this.els.ctx.getImageData(0, 0, 512, 512);
        } else if (this.els.freeze.style.display !== 'none') {
            sourceData = this.els.fCtx.getImageData(0, 0, 512, 512);
        }

        if (sourceData) {
            const channels = [
                { name: 'R', idx: 0, color: 'red' },
                { name: 'G', idx: 1, color: 'green' },
                { name: 'B', idx: 2, color: 'blue' }
            ];
            
            for (const ch of channels) {
                if (!this.state.locked[ch.name.toLowerCase()]) {
                    const mono = this.applyBradley(sourceData, ch.idx);
                    const code = jsQR(mono, 512, 512, { inversionAttempts: "attemptBoth" });
                    
                    if (code) {
                        this.lockChannel(ch.name, code.data, ch.color);
                    }
                }
            }
        }

        requestAnimationFrame(() => this.processLoop());
    },

    lockChannel: function(ch, data, color) {
        if (this.state.locked[ch.toLowerCase()]) return;
        
        this.state.locked[ch.toLowerCase()] = true;
        this.state.results[ch.toLowerCase()] = data;
        
        // Visual feedback
        this.flash();
        this.els.viewfinder.classList.add('locked');
        setTimeout(() => this.els.viewfinder.classList.remove('locked'), 300);

        // Add result to UI
        const item = document.createElement('div');
        item.className = 'scan-result-item';
        item.innerHTML = `
            <div class="scan-result-label ${color}">${ch} Channel</div>
            <div class="scan-result-content">${data}</div>
        `;
        this.els.resultsBox.prepend(item);

        // Check completion
        if (this.state.locked.r && this.state.locked.g && this.state.locked.b) {
            this.state.scanning = false; // Stop loop
        }
    },

    applyBradley: function(imgData, chIdx) {
        const w = imgData.width, h = imgData.height;
        const input = imgData.data;
        const output = new Uint8ClampedArray(w * h * 4);
        const intImg = new Int32Array(w * h);
        const s = Math.floor(w / 8), t = 15;

        for (let y = 0; y < h; y++) {
            let sum = 0;
            for (let x = 0; x < w; x++) {
                sum += input[(y * w + x) * 4 + chIdx];
                intImg[y * w + x] = (y > 0 ? intImg[(y - 1) * w + x] : 0) + sum;
            }
        }

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const x1 = Math.max(x - s, 0), x2 = Math.min(x + s, w - 1);
                const y1 = Math.max(y - s, 0), y2 = Math.min(y + s, h - 1);
                const count = (x2 - x1) * (y2 - y1);
                const sum = intImg[y2 * w + x2] - intImg[y1 * w + x2] - intImg[y2 * w + x1] + intImg[y1 * w + x1];
                const val = input[(y * w + x) * 4 + chIdx];
                const res = (val * count < sum * (100 - t) / 100) ? 0 : 255;
                const idx = (y * w + x) * 4;
                output[idx] = output[idx+1] = output[idx+2] = res; output[idx+3] = 255;
            }
        }
        return output;
    },

    flash: function() {
        const f = this.els.flash;
        f.classList.add('active');
        setTimeout(() => f.classList.remove('active'), 200);
        // Beep
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator(); const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880; o.type = "square";
            g.gain.setValueAtTime(0.1, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
            o.start(); o.stop(ctx.currentTime + 0.1);
        } catch(e){}
    }
};
