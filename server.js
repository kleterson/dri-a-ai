const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Banco de dados em memória (simples e funcional para começar)
let pedidos = [];

// Rotas para servir as telas
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/delivery', (req, res) => res.sendFile(path.join(__dirname, 'public', 'delivery.html')));

// Comunicação em tempo real via WebSocket
io.on('connection', (socket) => {
    console.log('Novo usuário conectado:', socket.id);

    // Enviar pedidos atuais ao conectar
    socket.emit('atualizar_pedidos', pedidos);

    // Receber novo pedido do cliente (index.html)
    socket.emit('atualizar_pedidos', pedidos);

    // Receber novo pedido
    socket.on('novo_pedido', (pedido) => {
        pedido.id = Date.now();
        pedido.status = 'Pendente';
        pedidos.push(pedido);
        
        // Avisar admin e motoboys em tempo real
        io.emit('atualizar_pedidos', pedidos);
    });

    // Atualizar status do pedido (Admin ou Motoboy)
    socket.on('mudar_status', ({ id, status }) => {
        const pedido = pedidos.find(p => p.id === id);
        if (pedido) {
            pedido.status = status;
            io.emit('atualizar_pedidos', pedidos);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});