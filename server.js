// server.js (Ana Sunucu Dosyası)

// Gerekli modülleri dahil et
const express = require('express');
const app = express();
// HTTP sunucusunu oluştur
const http = require('http').createServer(app); 
// Socket.IO'yu HTTP sunucusuna bağla
const io = require('socket.io')(http); 
// path modülünü dosya yollarını yönetmek için dahil et
const path = require('path');

// YOL DÜZELTMESİ 1/2: Artık 'public' klasörü yerine direkt ana klasörü (kök dizini) statik olarak yayınla.
app.use(express.static(path.join(__dirname))); 

// YOL DÜZELTMESİ 2/2: Ana sayfa isteğine direkt KÖK DİZİNDEN index.html dosyasını gönder.
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// Socket.IO bağlantısı kurulduğunda
io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı. Socket ID:', socket.id);

    // İstemciden gelen 'chat message' olayını dinle
    socket.on('chat message', (msg) => {
        // Gelen mesajı, o anda bağlı olan HERKESE geri gönder (io.emit)
        io.emit('chat message', msg); 
        console.log('Gönderilen mesaj:', msg);
    });

    // Kullanıcı ayrıldığında
    socket.on('disconnect', () => {
        console.log('Bir kullanıcı ayrıldı.');
    });
});

// Sunucuyu başlat ve portu dinle
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
