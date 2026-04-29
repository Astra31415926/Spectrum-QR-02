/* === js/engine-3d.js === */

const Engine3D = (function() {
    return {
        handleInput: function() {
            const r = document.getElementById('input-r').value;
            const g = document.getElementById('input-g').value;
            const b = document.getElementById('input-b').value;
            const btnSave = document.getElementById('btn-save-3d');
            btnSave.disabled = !(r && g && b);
            this.generate();
        },

        generate: function() {
            const texts = [
                document.getElementById('input-r').value,
                document.getElementById('input-g').value,
                document.getElementById('input-b').value
            ];
            
            if(!texts.some(t=>t)) return;
            
            let maxVer = 1;
            texts.forEach(t => { 
                if(t){ 
                    const tmp=qrcode(0,'M'); tmp.addData(t); tmp.make(); 
                    const v=Math.floor((tmp.getModuleCount()-17)/4); 
                    if(v>maxVer)maxVer=v; 
                }
            });
            
            const canvas = document.getElementById('canvas-3d');
            const ctx = canvas.getContext('2d');
            ctx.fillStyle="#000"; ctx.fillRect(0,0,512,512);
            ctx.globalCompositeOperation = "lighten";
            
            texts.forEach((text, i) => {
                if(!text) return;
                try {
                    const qr = qrcode(maxVer, 'M'); qr.addData(text); qr.make();
                    const mod = 512 / qr.getModuleCount();
                    ctx.fillStyle = i === 0 ? "#FF0000" : (i === 1 ? "#00FF00" : "#0000FF");
                    for(let r=0; r<qr.getModuleCount(); r++) 
                        for(let c=0; c<qr.getModuleCount(); c++) 
                            if(qr.isDark(r, c)) ctx.fillRect(c*mod, r*mod, mod, mod);
                } catch(e) {}
            });
            ctx.globalCompositeOperation = "source-over";
        }
    };
})();
