# Barangay ID System

A comprehensive web-based ID card generation system for Barangay Holy Spirit, featuring 8 different template designs, real-time editing capabilities, and professional PVC card printing.

## 🔧 Latest Updates (November 10, 2025)

**✅ All Critical Issues Resolved - System Ready for Use**

Recent fixes applied:
- ✅ Fixed ES6 export syntax errors in `dataService.js`
- ✅ Resolved all service definition issues (ResidentService, RequestService, etc.)
- ✅ Added missing signature image placeholder
- ✅ Removed problematic test scripts
- ✅ Backend server properly configured and running
- ✅ Added convenient startup scripts (`start-server.bat` and `start-server.ps1`)

For detailed information about recent fixes, see: [`FIXES_APPLIED.md`](FIXES_APPLIED.md)  
For API usage examples, see: [`API_REFERENCE.js`](API_REFERENCE.js)

## 🚀 Features

- **Multiple ID Templates**: 8 professionally designed templates (A through H)
- **Real-time Editing**: Live preview and editing of ID card information
- **Image Management**: Photo upload and positioning with drag-and-drop support
- **PVC Card Printing**: Optimized for professional ID card printing
- **User Authentication**: Secure login system for administrators
- **Database Management**: SQLite database for resident information
- **Responsive Design**: Works on desktop and mobile devices
- **🤖 AI Chatbot**: Powered by Google Gemini 2.0 Flash - Answers resident questions in Filipino about barangay services

## 📋 System Requirements

- **Node.js** (version 14 or higher)
- **NPM** (Node Package Manager)
- **Web Browser** (Chrome, Firefox, Safari, Edge)
- **Operating System**: Windows, macOS, or Linux

## 🛠️ Installation & Setup

### Step 1: Install Dependencies

1. Open PowerShell/Command Prompt as Administrator
2. Navigate to the project directory:
   ```powershell
   cd "c:\Users\rdmir\Downloads\barangay-id-system"
   ```

3. Install backend dependencies:
   ```powershell
   cd backend
   npm install
   ```

### Step 2: Start the Backend Server

1. In the backend directory, start the server:
   ```powershell
   node server.js
   ```
   
2. You should see: `Server running on port 3000`

### Step 3: Start the Frontend Server

1. Open a new PowerShell/Command Prompt window
2. Navigate to the main project directory:
   ```powershell
   cd "c:\Users\rdmir\Downloads\barangay-id-system"
   ```

3. Start the HTTP server:
   ```powershell
   python -m http.server 8080
   ```
   
   *Alternative for Python 2:*
   ```powershell
   python -m SimpleHTTPServer 8080
   ```

4. You should see: `Serving HTTP on :: port 8080`

### Step 4: Configure AI Chatbot (Optional)

The system includes an AI-powered chatbot. To enable it:

1. Get a **free** Gemini API key from: https://makersuite.google.com/app/apikey
2. Add your API key to `backend/routes/chatbot.js` (line 9) OR create `backend/.env`:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. Restart the backend server

> 📚 **Detailed chatbot setup guide**: See [`CHATBOT_SETUP.md`](CHATBOT_SETUP.md)  
> ⚡ **Quick fix**: See [`QUICK_FIX_CHATBOT.md`](QUICK_FIX_CHATBOT.md)

### Step 5: Access the System

1. Open your web browser
2. Navigate to: `http://localhost:8080/` (or `http://localhost:8080/index.html`)
3. Use the default login credentials or register new users through the backend

## 🎨 Available ID Templates

### Template A - Classic Blue
- **Theme**: Professional blue design
- **Best for**: General purpose ID cards

### Template B - Green Professional
- **Theme**: Clean green corporate design
- **Best for**: Official government IDs

### Template C - Black & Gold
- **Theme**: Elegant black background with gold accents
- **Best for**: Premium or VIP ID cards

### Template D - Red Dynamic
- **Theme**: Bold red design with modern elements
- **Best for**: Emergency services or special access

### Template E - Purple Elegant
- **Theme**: Sophisticated purple gradient
- **Best for**: Senior citizen or special member IDs

### Template F - Orange Vibrant
- **Theme**: Energetic orange design
- **Best for**: Youth or community volunteer IDs

### Template G - Teal Modern
- **Theme**: Contemporary teal with clean lines
- **Best for**: Healthcare or professional services

### Template H - Maroon Classic
- **Theme**: Traditional maroon with gold details
- **Best for**: Official or ceremonial IDs

## 📖 How to Use the System

### Creating a New ID Card

1. **Login**: Access the system through the home page (`index.html`)
2. **Select Template**: Choose from 8 available templates
3. **Enter Information**: Fill in resident details:
   - Full Name
   - Address
   - Contact Number
   - Date of Birth
   - Civil Status
   - Occupation
   - Emergency Contact

4. **Upload Photo**: Click on the photo area to upload resident image
5. **Real-time Editing**: Click on any text field to edit in live preview
6. **Position Photo**: Drag and drop the photo to perfect position
7. **Print**: Use the print function for PVC card output

### Administrative Features

- **User Management**: Add/edit system users
- **Resident Database**: Maintain resident information
- **Audit Trail**: Track all system activities
- **Backup/Restore**: Database management tools

## 🖨️ Printing Guidelines

### PVC Card Specifications
- **Size**: CR80 standard (85.6mm × 53.98mm)
- **Resolution**: 300 DPI minimum
- **Format**: Both front and back sides included
- **Bleed**: Templates include proper margins

### Print Setup
1. Use PVC card printer (recommended: Evolis, Zebra, or Magicard)
2. Load PVC cards into printer tray
3. Ensure proper driver installation
4. Print using browser's print function
5. Select appropriate paper size (ID Card/CR80)

## 🗂️ File Structure

```
barangay-id-system/
├── README.md                 # This documentation file
├── index.html               # Login page (main entry point)
├── coreA.html              # Main ID generation interface
├── apisClient.js           # Frontend API communication
├── assets/                 # Static files and images
│   ├── coreA.css          # Styling for main interface
│   ├── coreA.js           # Frontend JavaScript logic
│   └── [images]           # Logo and signature files
└── backend/               # Server-side application
    ├── server.js          # Main server file
    ├── db.js              # Database configuration
    ├── digitalid.db       # SQLite database
    ├── package.json       # Node.js dependencies
    └── middleware/        # Authentication middleware
        └── auth.js        # Authentication logic
```

## 🔧 Configuration

### Database Configuration
- Database file: `backend/digitalid.db`
- Type: SQLite
- Tables: users, residents, requests, complaints, audit_log

### Server Configuration
- Backend Port: 3000 (configurable in server.js)
- Frontend Port: 8080 (configurable when starting HTTP server)
- CORS: Enabled for cross-origin requests

### Security Settings
- JWT Authentication
- Session management
- Input validation
- SQL injection protection

## � Database Management

### Accessing the Database via Terminal

The system uses SQLite database (`backend/digitalid.db`). You can access it directly through terminal for advanced operations:

#### Prerequisites
- Install SQLite3 on your system:
  ```powershell
  # For Windows (using Chocolatey)
  choco install sqlite
  
  # Or download from: https://www.sqlite.org/download.html
  ```

#### Connecting to Database
1. Open PowerShell/Command Prompt
2. Navigate to backend directory:
   ```powershell
   cd "c:\Users\rdmir\Downloads\barangay-id-system\backend"
   npm start
   ```
3. Open SQLite command line:
   ```powershell
   sqlite3 digitalid.db
   ```

#### Common Database Commands
```sql
-- View all tables
.tables

-- View table structure
.schema users
.schema residents

-- Query residents
SELECT * FROM residents;

-- Query users
SELECT * FROM users;

-- View recent audit logs
SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 10;

-- Count total residents
SELECT COUNT(*) FROM residents;

-- Export data to CSV
.mode csv
.output residents_backup.csv
SELECT * FROM residents;
.output stdout

-- Exit SQLite
.quit
```

#### Database Backup & Restore
```powershell
# Create backup
sqlite3 digitalid.db ".backup backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').db"

# Restore from backup
sqlite3 digitalid.db ".restore backup_20251107_143000.db"

# Export SQL dump
sqlite3 digitalid.db ".dump" > database_backup.sql
```

#### Database Schema Information
- **users**: System administrators and operators
- **residents**: Barangay resident information
- **requests**: Service requests and applications
- **complaints**: Resident complaints and issues
- **audit_log**: System activity tracking

### Database Maintenance
- **Regular Backups**: Create daily backups before heavy usage
- **Integrity Check**: Run `.schema` and `PRAGMA integrity_check;` regularly
- **Size Monitoring**: Monitor database file size growth
- **Performance**: Use `VACUUM;` command to optimize database periodically

## �� Troubleshooting

### Common Issues

#### "Cannot connect to server"
- Ensure backend server is running on port 3000
- Check firewall settings
- Verify Node.js is properly installed

#### "Images not loading"
- Confirm frontend server is running on port 8080
- Check assets folder permissions
- Verify image file formats (JPG, PNG supported)

#### "Database errors"
- Ensure `digitalid.db` exists in backend folder
- Check file permissions
- Restart backend server

#### "Print layout issues"
- Use Chrome or Firefox for best print results
- Ensure printer drivers are updated
- Check PVC card size settings

### Getting Help

1. Check server logs in terminal/command prompt
2. Use browser developer tools (F12) for frontend issues
3. Verify all dependencies are installed
4. Ensure correct file permissions

## 📞 Support & Maintenance

### Regular Maintenance
- **Database Backup**: Regularly backup `digitalid.db`
- **Log Monitoring**: Check server logs for errors
- **Updates**: Keep Node.js and dependencies updated
- **Security**: Regular password changes for admin accounts

### System Updates
To update the system:
1. Backup current database
2. Download new version
3. Copy database to new installation
4. Test functionality before production use

## 📄 License & Credits

- **Developed for**: Barangay Holy Spirit, Quezon City
- **Technology Stack**: Node.js, Express, SQLite, HTML5, CSS3, JavaScript
- **Template Design**: Custom responsive designs optimized for PVC printing
- **Image Assets**: Official logos and signatures (ensure proper usage rights)

---

**Note**: This system is designed specifically for Barangay Holy Spirit ID card generation. Customize templates and branding as needed for other locations.

For technical support or feature requests, contact the system administrator.