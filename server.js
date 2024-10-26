const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

let queue = [];
const deviceQueue = new Map(); // 用于存储设备指纹和队列位置的映射

// 允许的位置范围（示例坐标，您需要根据实际情况调整）
const allowedLocation = {
    latitude: 43.6546721,
    longitude: -79.3984089,
    radius: 1000  // 米
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

function removeInactiveUsers() {
    const now = Date.now();
    queue = queue.filter(user => {
        if (now - user.lastActiveTime > 30 * 60 * 1000) { // 30 minutes
            deviceQueue.delete(user.fingerprint);
            io.emit('userRemoved', user.fingerprint, '由于30分钟内不活跃，您已被移出队列');
            return false;
        }
        return true;
    });
    io.emit('updateQueue', queue);
}

setInterval(removeInactiveUsers, 60 * 1000); // 每分钟检查一次

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.emit('updateQueue', queue);

    socket.on('joinQueue', (userData) => {
        const { username, fingerprint, latitude, longitude } = userData;
        
        if (deviceQueue.has(fingerprint)) {
            socket.emit('joinError', '该设备已经在队列中');
            return;
        }

        const distance = calculateDistance(latitude, longitude, allowedLocation.latitude, allowedLocation.longitude);
        if (distance > allowedLocation.radius) {
            socket.emit('joinError', '您不在允许的位置范围内');
            return;
        }

        const newUser = {
            id: socket.id,
            username,
            fingerprint,
            joinTime: new Date().toLocaleString(),
            lastActiveTime: Date.now(),
            skip: false,
            skipCount: 0
        };
        queue.push(newUser);
        deviceQueue.set(fingerprint, newUser);
        io.emit('updateQueue', queue);
    });

    socket.on('moveToEnd', (fingerprint) => {
        if (queue.length > 0 && queue[0].fingerprint === fingerprint) {
            const user = queue.shift();
            user.joinTime = new Date().toLocaleString();
            user.lastActiveTime = Date.now();
            user.skip = false;
            user.skipCount = 0;
            queue.push(user);
            io.emit('updateQueue', queue);
        } else {
            socket.emit('moveError', '您不是队首或队列为空');
        }
    });

    socket.on('skipFirst', (fingerprint) => {
        if (queue.length > 1 && queue[1].fingerprint === fingerprint) {
            const skippedUser = queue.shift();
            skippedUser.skip = true;
            skippedUser.skipCount += 1;
            skippedUser.joinTime = new Date().toLocaleString();
            skippedUser.lastActiveTime = Date.now();
            
            if (skippedUser.skipCount >= 2) {
                deviceQueue.delete(skippedUser.fingerprint);
                io.emit('userRemoved', skippedUser.fingerprint, '由于被连续两次标记为skip，您已被移出队列');
            } else {
                queue.push(skippedUser);
            }
            
            io.emit('updateQueue', queue);
        } else {
            socket.emit('skipError', '您不是队列中的第二位或队列长度不足');
        }
    });

    socket.on('leaveQueue', (fingerprint) => {
        const index = queue.findIndex(user => user.fingerprint === fingerprint);
        if (index !== -1) {
            queue.splice(index, 1);
            deviceQueue.delete(fingerprint);
            io.emit('updateQueue', queue);
            socket.emit('leaveSuccess', '您已成功退出队列');
        } else {
            socket.emit('leaveError', '您不在队列中');
        }
    });

    socket.on('updateActivity', (fingerprint) => {
        const user = queue.find(u => u.fingerprint === fingerprint);
        if (user) {
            user.lastActiveTime = Date.now();
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        const index = queue.findIndex(user => user.id === socket.id);
        if (index !== -1) {
            const user = queue[index];
            queue.splice(index, 1);
            deviceQueue.delete(user.fingerprint);
            io.emit('updateQueue', queue);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});