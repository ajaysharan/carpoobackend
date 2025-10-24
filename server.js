require('dotenv').config();
require('./src/database/connect');

const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
// const authenticateSocket = require('./src/middelwares/authToken')
const { Server } = require('socket.io');
const { User, Admin, Notification } = require('./src/models');
const Message = require('./src/models/Message')
// Create a new Express app
const app = express();
const jwt = require("jsonwebtoken");
const { default: mongoose } = require('mongoose');

// CORS setup
const origin = [undefined, 'http://localhost:5173', 'http://localhost:5174'];

app.use(cors({ origin, credentials: true }));

// Parse JSON and URL-encoded requests
app.use(express.json({ type: 'application/json', limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Use cookie-parser middleware
app.use(cookieParser(process.env.X_API_KEY));

// Serve static files
app.use('/uploads', express.static('public/uploads'));
app.all('/uploads/*', (req, res) => res.sendFile(path.resolve(__dirname, './public/uploads/img-not-found.png')));

// Define routes
app.get('/', async (req, res) => res.json({ status: true, message: 'API Working fine..!!' }));

// Initialize server (http/https)
const PORT = parseInt(process.env.PORT) || 3001;
let server = null;
if (process.env.IS_HTTPS === 'true') {
    server = https.createServer(
        {
            key: fs.readFileSync(process.env.CERTIFICATE_KEY_FILE_PATH),
            cert: fs.readFileSync(process.env.CERTIFICATE_FILE_PATH)
        },
        app
    );
} else {
    server = http.createServer(app);
}

const io = new Server(server, {
  cors: {
    origin,
    credentials: true,
  },
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

const onlineUsers = new Map();

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error: No token provided"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN_KEY);
    socket.user = decoded;
    next();
  } catch (err) {
    console.log("decoded", err);
    return next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.user.userId.toString();
  onlineUsers.set(userId, {
    socketId: socket.id,
    user: socket.user,
  });

  io.emit("onlineUsers", Array.from(onlineUsers.keys()));

  // ✅ Get user list
  socket.on("getUsers", async () => {
    try {
      const users = await Admin.find({}, "name email phone image");
      socket.emit("users", users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  });

  // ✅ Get chat history
  socket.on("getChatHistory", async ({ userId, otherUserId }) => {
    try {
      const messages = await Message.find({
        $or: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      })
        .sort({ date_time: 1 })
        .lean();

      socket.emit("chatHistory", messages);
    } catch (error) {
      console.error("Error fetching chat history:", error);
    }
  });

  // ✅ Send message
  socket.on("sendMessage", async (messageData) => {
    try {
      const { senderId, receiverId, content } = messageData;

      const message = new Message({
        senderId,
        receiverId,
        content,
        date_time: new Date(),
        isRead: false,
      });

      await message.save();

      const receiverOnline = onlineUsers.get(receiverId);
      if (receiverOnline) {
        io.to(receiverOnline.socketId).emit("newMessage", message);
      }

      socket.emit("newMessage", message);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

  // ✅ Typing event
  socket.on("typing", ({ to }) => {
    const receiverOnline = onlineUsers.get(to);
   
    if (receiverOnline) {
      io.to(receiverOnline.socketId).emit("typing", { from: userId });
    }
  });

  // ✅ Read receipt: Mark messages as read
  socket.on("messageSeen", async ({ senderId, receiverId }) => {
    try {
      await Message.updateMany(
        {
          senderId,
          receiverId,
          isRead: false,
        },
        { $set: { isRead: true } }
      );

      const senderSocket = onlineUsers.get(senderId);
      if (senderSocket) {
        io.to(senderSocket.socketId).emit("messageSeenAck", {
          senderId: receiverId, // from the perspective of the receiver
        });
      }
    } catch (error) {
      console.error("Error updating read receipts:", error);
    }
  });
  socket.on("deleteMessage", ({ messageId }) => {
    // Delete message from DB (optional)
    io.emit("messageDeleted", { messageId });
  });

  socket.on("get_notification", async ({ receiverId }) => {
    try {
      const user = new mongoose.Types.ObjectId(receiverId);
      const notifications = await Notification.find({ user}).sort({ createdAt: -1 });
      socket.emit("notification", notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  });

  socket.on('send_notification', async ({ receiverId, receiverType = 'Admin', senderId, message, type = "default" }) => {
      const newNotification = new Notification({ receiverId, receiverType, senderId, message, type });
      await newNotification.save();
      io.to(receiverId).emit('new_notification', newNotification);
  });

  // ✅ On disconnect
  socket.on("disconnect", () => {
    console.log(`User ${socket.user.email} disconnected`);
    onlineUsers.delete(userId);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  });
});



// Middleware
app.use(require('./src/middelwares/customMethods'));
app.use('/api-v1', require('./src/routes/index.routes'));

app.use('/client', require('./src/routes/client.routes'));

app.use('/employee', require('./src/routes/employee.routes'));
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error'
    });
});



const multer = require("multer");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/"); // save in this folder
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// POST /upload endpoint
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image uploaded" });
  }

  const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
  return res.json({ success: true, url });
});
server.listen(PORT, () => {
    console.log(process.env.IS_HTTPS === 'true' ? `HTTPS Server is running on port ${PORT}.` : `HTTP Server is running on port ${PORT}.`);
});
