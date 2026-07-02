// scripts/copy-out.js
// Script cross-platform para copiar a pasta out/ para dist/
// Funciona no Windows, Mac e Linux sem dependências externas

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'out');
const dest = path.join(__dirname, '..', 'dist');

// Remove dist/ se existir
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
  console.log('✓ Pasta dist/ removida');
}

// Cria dist/
fs.mkdirSync(dest, { recursive: true });
console.log('✓ Pasta dist/ criada');

// Copia out/ → dist/ recursivamente
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir(src, dest);
console.log('✓ Arquivos copiados de out/ para dist/');
console.log('✅ Build concluído com sucesso!');
