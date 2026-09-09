const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Iniciando Cloudflare Tunnel...');

// 1. Iniciamos cloudflared
const cloudflared = spawn('npx', ['-y', 'cloudflared', 'tunnel', '--url', 'http://localhost:3000'], {
    shell: true
});

let tunnelUrl = null;
let nodemonProcess = null;

// Cloudflared imprime su salida en stderr
cloudflared.stderr.on('data', (data) => {
    const output = data.toString();
    
    // Buscamos la URL de trycloudflare
    const match = output.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
    if (match && !tunnelUrl) {
        tunnelUrl = match[0];
        console.log(`\n======================================================`);
        console.log(`✅ TÚNEL CREADO: ${tunnelUrl}`);
        console.log(`======================================================\n`);

        // 2. Actualizamos el archivo .env
        const envPath = path.join(__dirname, '.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            
            if (envContent.includes('WEBHOOK_URL=')) {
                envContent = envContent.replace(/WEBHOOK_URL=.*/, `WEBHOOK_URL=${tunnelUrl}`);
            } else {
                envContent += `\nWEBHOOK_URL=${tunnelUrl}`;
            }
            
            fs.writeFileSync(envPath, envContent);
            console.log('✅ Archivo .env actualizado automáticamente con la nueva URL.');
        }

        // 3. Iniciamos el servidor de desarrollo (nodemon)
        console.log('Iniciando el backend...\n');
        nodemonProcess = spawn('npx', ['nodemon', 'index.js'], {
            stdio: 'inherit', // Para ver la salida colorida en consola
            shell: true
        });
    }
});

cloudflared.on('error', (err) => {
    console.error('Error al iniciar Cloudflare:', err);
});

// Asegurarse de cerrar todos los procesos al salir
process.on('SIGINT', () => {
    if (cloudflared) cloudflared.kill('SIGINT');
    if (nodemonProcess) nodemonProcess.kill('SIGINT');
    process.exit();
});
