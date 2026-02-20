const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class FileUploadService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads');
    this.profilePicsDir = path.join(this.uploadDir, 'profile-pics');
    this.documentsDir = path.join(this.uploadDir, 'documents');
    
    // Create directories if they don't exist
    this.ensureDirectories();
    
    // Configure multer storage
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadType = req.body.uploadType || 'document';
        const dir = uploadType === 'profile-pic' ? this.profilePicsDir : this.documentsDir;
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
      }
    });
    
    // File filter for security
    this.fileFilter = (req, file, cb) => {
      const uploadType = req.body.uploadType || 'document';
      
      if (uploadType === 'profile-pic') {
        // Allow only images for profile pictures
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed for profile pictures'), false);
        }
      } else {
        // Allow documents (PDF, DOC, etc.)
        const allowedMimes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/gif',
          'text/plain'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('File type not allowed'), false);
        }
      }
    };
    
    // Configure multer
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5 // Max 5 files per request
      },
      fileFilter: this.fileFilter
    });
  }

  ensureDirectories() {
    const dirs = [this.uploadDir, this.profilePicsDir, this.documentsDir];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created upload directory: ${dir}`);
      }
    });
  }

  // Middleware for single file upload
  singleUpload(fieldName) {
    return this.upload.single(fieldName);
  }

  // Middleware for multiple file upload
  multipleUpload(fieldName, maxCount = 5) {
    return this.upload.array(fieldName, maxCount);
  }

  // Process uploaded profile picture
  async processProfilePicture(file, militaryId) {
    if (!file) {
      return null;
    }

    const fileInfo = {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
      militaryId: militaryId,
      type: 'profile-pic'
    };

    // Generate web-accessible URL
    fileInfo.url = `/uploads/profile-pics/${file.filename}`;

    console.log(`✅ Profile picture uploaded for ${militaryId}: ${file.filename}`);
    return fileInfo;
  }

  // Process uploaded documents
  async processDocuments(files, militaryId) {
    if (!files || files.length === 0) {
      return [];
    }

    const processedFiles = files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date(),
      militaryId: militaryId,
      type: 'document',
      url: `/uploads/documents/${file.filename}`
    }));

    console.log(`✅ ${files.length} document(s) uploaded for ${militaryId}`);
    return processedFiles;
  }

  // Delete a file
  async deleteFile(filename, type = 'document') {
    try {
      const dir = type === 'profile-pic' ? this.profilePicsDir : this.documentsDir;
      const filePath = path.join(dir, filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ File deleted: ${filename}`);
        return true;
      } else {
        console.log(`⚠️ File not found: ${filename}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ Error deleting file ${filename}:`, error.message);
      return false;
    }
  }

  // Get file info
  getFileInfo(filename, type = 'document') {
    const dir = type === 'profile-pic' ? this.profilePicsDir : this.documentsDir;
    const filePath = path.join(dir, filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        type,
        url: `/uploads/${type === 'profile-pic' ? 'profile-pics' : 'documents'}/${filename}`
      };
    }
    
    return null;
  }

  // Cleanup old files (run periodically)
  async cleanupOldFiles(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const dirs = [
      { path: this.profilePicsDir, type: 'profile-pics' },
      { path: this.documentsDir, type: 'documents' }
    ];
    
    let deletedCount = 0;
    
    for (const dir of dirs) {
      if (fs.existsSync(dir.path)) {
        const files = fs.readdirSync(dir.path);
        
        for (const file of files) {
          const filePath = path.join(dir.path, file);
          const stats = fs.statSync(filePath);
          
          if (stats.birthtime < cutoffDate) {
            try {
              fs.unlinkSync(filePath);
              deletedCount++;
              console.log(`🗑️ Cleaned up old file: ${file}`);
            } catch (error) {
              console.log(`❌ Error cleaning up ${file}:`, error.message);
            }
          }
        }
      }
    }
    
    console.log(`🧹 Cleanup complete: ${deletedCount} files removed`);
    return deletedCount;
  }

  // Get upload statistics
  getUploadStats() {
    const stats = {
      profilePics: { count: 0, totalSize: 0 },
      documents: { count: 0, totalSize: 0 }
    };
    
    const dirs = [
      { path: this.profilePicsDir, key: 'profilePics' },
      { path: this.documentsDir, key: 'documents' }
    ];
    
    dirs.forEach(dir => {
      if (fs.existsSync(dir.path)) {
        const files = fs.readdirSync(dir.path);
        stats[dir.key].count = files.length;
        
        files.forEach(file => {
          const filePath = path.join(dir.path, file);
          const fileStats = fs.statSync(filePath);
          stats[dir.key].totalSize += fileStats.size;
        });
      }
    });
    
    return stats;
  }
}

module.exports = new FileUploadService();