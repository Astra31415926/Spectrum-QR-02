/* js/engine-ornament.js */

const OrnamentEngine = (function() {
    
    const SPRITE_LIB = [
        [73,42,28,127,28,42,73], [127,65,93,85,93,65,127], [85,62,99,42,99,62,85],
        [42,119,34,73,34,119,42], [28,42,73,119,73,42,28], [0,62,34,42,46,32,63],
        [15,1,29,5,52,16,64], [64,96,112,120,112,96,64], [76,102,51,25,51,102,76],
        [119,69,117,0,87,81,119], [119,85,119,0,119,85,119], [119,65,93,20,93,65,119],
        [62,73,93,127,93,73,62], [42,107,8,119,8,107,42], [8,42,8,119,8,42,8],
        [28,8,65,99,65,8,28], [54,99,73,20,73,99,54], [63,31,15,7,3,1,0],
        [127,63,31,15,7,3,1], [127,31,31,7,7,1,1], [119,17,93,68,119,17,89],
        [119,21,87,80,127,17,89], [119,85,127,20,127,85,119], [87,80,87,0,117,5,117],
        [95,80,87,65,117,5,125], [30,80,87,65,117,5,60], [91,80,11,93,104,5,109],
        [42,99,8,93,8,99,42], [99,99,0,0,0,99,99], [99,99,99,99,99,99,99],
        [119,93,99,34,99,93,119], [54,85,99,8,99,85,54], [91,73,109,36,54,18,91],
        [127,8,107,34,107,8,127], [42,34,42,8,42,34,42], [56,43,9,127,72,106,14],
        [60,72,81,99,69,9,30], [12,56,33,107,66,14,24], [32,126,34,34,34,63,2],
        [100,94,51,42,102,61,19], [6,92,118,34,55,29,48], [28,62,119,99,119,62,28],
        [62,99,73,93,73,99,62], [126,67,89,85,77,97,63], [54,85,107,28,107,85,54],
        [127,119,99,73,99,119,127], [12,22,51,113,14,76,104], [107,73,8,127,8,73,107],
        [0,62,34,42,58,2,126], [85,21,117,5,125,1,127], [52,102,71,85,71,102,52],
        [8,8,42,34,54,20,93], [119,99,107,8,107,99,119], [62,34,107,8,107,34,62],
        [73,62,34,107,34,62,73], [123,123,96,107,3,111,111], [91,27,96,107,3,108,109],
        [0,63,32,62,2,126,0], [64,95,81,93,69,125,1], [51,51,102,102,76,76,25]
    ];

    let seed = Date.now();

    function seededRandom() {
        let x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }

    function buildGrid(size) {
        const grid = Array(size).fill(0).map(() => Array(size).fill(0));
        const center = Math.floor(size/2);
        const maxBlocks = Math.ceil((size/2 + 7)/7);
        const octantMap = new Map();

        for(let by=0; by<maxBlocks; by++) {
            for(let bx=by; bx<maxBlocks; bx++) {
                const patternIdx = Math.floor(seededRandom() * SPRITE_LIB.length);
                const pattern = SPRITE_LIB[patternIdx];
                const flipX = seededRandom() > 0.5;
                const flipY = seededRandom() > 0.5;

                for(let py=0; py<7; py++) {
                    for(let px=0; px<7; px++) {
                        let sX = flipX ? (6-px) : px;
                        let sY = flipY ? (6-py) : py;
                        
                        if((pattern[sY] >> (6-sX)) & 1) {
                            let xRel = (bx*7) + px - 3;
                            let yRel = (by*7) + py - 3;
                            if(xRel >= yRel && yRel >= 0) octantMap.set(`${xRel},${yRel}`, true);
                        }
                    }
                }
            }
        }

        octantMap.forEach((v, k) => {
            const [x, y] = k.split(',').map(Number);
            const points = [[x, y], [y, x], [-x, y], [-y, x], [x, -y], [y, -x], [-x, -y], [-y, -x]];
            points.forEach(([px, py]) => {
                const aX = center + px; const aY = center + py;
                if(aX >= 0 && aX < size && aY >= 0 && aY < size) grid[aY][aX] = 1;
            });
        });
        return grid;
    }

    function drawGrid(ctx, grid, size, cell) {
        for(let r=0; r<size; r++) for(let c=0; c<size; c++) if(grid[r][c]) ctx.fillRect(c*cell, r*cell, cell+0.5, cell+0.5);
    }

    return {
        handleInput: function() {
            const val = document.getElementById('input-ornament').value;
            const btnSave = document.getElementById('btn-save-orn');
            btnSave.disabled = val.length === 0;
            this.generate();
        },

        generate: function() {
            const text = document.getElementById('input-ornament').value;
            const canvas = document.getElementById('canvas-ornament');
            const ctx = canvas.getContext('2d');
            
            if(!text) {
                ctx.fillStyle="#000"; ctx.fillRect(0,0,512,512); return;
            }
            
            try {
                const qr = qrcode(0, 'M');
                qr.addData(unescape(encodeURIComponent(text)));
                qr.make();
                
                const modCount = qr.getModuleCount();
                const quietZone = 4;
                const totalSize = modCount + quietZone * 2;
                const cellSize = 512 / totalSize;

                ctx.fillStyle = "#000"; ctx.fillRect(0,0,512,512);
                ctx.globalCompositeOperation = "screen";

                const gridR = buildGrid(totalSize);
                const gridG = buildGrid(totalSize);

                ctx.fillStyle = "#FF0000";
                drawGrid(ctx, gridR, totalSize, cellSize);
                
                ctx.fillStyle = "#00FF00";
                drawGrid(ctx, gridG, totalSize, cellSize);
                
                ctx.fillStyle = "#0000FF";
                for(let r=0; r<modCount; r++) {
                    for(let c=0; c<modCount; c++) {
                        if(qr.isDark(r, c)) {
                            ctx.fillRect((c+quietZone)*cellSize, (r+quietZone)*cellSize, cellSize, cellSize);
                        }
                    }
                }
                ctx.globalCompositeOperation = "source-over";

            } catch(e) { console.error(e); }
        }
    };
})();
