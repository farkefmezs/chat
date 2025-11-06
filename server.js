// server.js (Gelistirilmis Sunucu Dosyasi)
const express = require('express');
const app = express();
const http = require('http').createServer(app); 
const io = require('socket.io')(http); 
const path = require('path');

// Sunucu uzerinde kullanicilari ve kullanici adlarini tutmak icin nesne
// Key: Socket ID, Value: Username (Kullanici Adi)
const users = {}; 

// Dosyalarin bulundugu klasoru statik olarak yayinla (index.html'in kok dizinde oldugu varsayiliyor)
app.use(express.static(path.join(__dirname))); 

// Ana sayfa istegine direkt index.html dosyasini gonder
app.get('/', (req, res) => {
    // index.html dosyasinin kok dizinde (root) oldugunu varsayiyoruz
    res.sendFile(path.join(__dirname, 'index.html')); 
});

// Kullanici listesini guncelle ve herkese gonder
function updateUsers() {
    // Sadece kullanici adlarinin bir listesini olustur
    const userList = Object.values(users);
    io.emit('update users', userList);
}

// Socket.IO baglantisi kuruldugunda
io.on('connection', (socket) => {
    console.log('Yeni bir kullanici baglandi. Socket ID:', socket.id);

    // 1. KULLANICI ADI AYARLAMA (Ilk baglantida cagrilir)
    socket.on('set user', (username) => {
        // Kullanici adinin bos veya zaten kullanilip kullanilmadigini kontrol et
        if (username && !Object.values(users).includes(username)) {
            // Kullanici adini sakla
            users[socket.id] = username;

            // Herkese katildigini bildir
            socket.broadcast.emit('chat message', {
                user: 'Sunucu',
                text: `${username} sohbete katildi.`,
                isSystem: true // Sistem mesaji oldugunu belirt
            });

            // Kullanici listesini guncelle
            updateUsers();
        } else {
            // Gecersiz veya hali hazirda kullanilan bir isimse geri bildirim gonder
            socket.emit('username error', 'Bu kullanici adi gecersiz veya kullaniliyor.');
        }
    });

    // 2. MESAJ GONDERME
    socket.on('chat message', (msg) => {
        const username = users[socket.id] || 'Bilinmeyen Kullanıcı';
        
        // Gelen mesajı, o anda bağlı olan HERKESE geri gonder (io.emit)
        io.emit('chat message', {
            user: username,
            text: msg,
            timestamp: new Date().toLocaleTimeString('tr-TR')
        }); 
        console.log(`[${username}]: ${msg}`);
    });

    // 3. YAZIYOR... BILDIRIMI
    socket.on('typing', () => {
        const username = users[socket.id];
        // Kendisi disindaki herkese "yaziyor" bildirimini gonder
        socket.broadcast.emit('typing', username); 
    });

    // 4. YAZMAYI BIRAKTI BILDIRIMI
    socket.on('stop typing', () => {
        const username = users[socket.id];
        // Kendisi disindaki herkese "yazmiyor" bildirimini gonder
        socket.broadcast.emit('stop typing', username);
    });

    // 5. KULLANICI AYRILDIGINDA
    socket.on('disconnect', () => {
        const username = users[socket.id];
        
        if (username) {
            console.log(`${username} ayrildi.`);
            
            // Kullaniciyi listeden kaldir
            delete users[socket.id];

            // Herkese ayrildigini bildir
            io.emit('chat message', {
                user: 'Sunucu',
                text: `${username} sohbetten ayrildi.`,
                isSystem: true
            });

            // Kullanici listesini guncelle
            updateUsers();
        } else {
            console.log('Bilinmeyen bir kullanici ayrildi.');
        }
    });
});

// Sunucuyu başlat ve portu dinle
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda calisiyor. http://localhost:${PORT}`);
});
