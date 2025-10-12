//config/multerConfig.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads'); // 'server/uploads'

// Ensure the upload directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
}

// Configure disk storage for Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {

        // The directory must exist or Multer will throw an error
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {

        // Generates a unique filename using current timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
