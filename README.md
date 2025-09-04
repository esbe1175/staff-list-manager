# Staff List Manager

A Tauri desktop application for creating printable A4 staff lists with photos. Built with React, TypeScript, and Rust.

## Features

- 📸 **Image Management**: Load staff photos from folders or individual files
- 👥 **Two Sections**: "Administrationen" and "Sygeplejersker" 
- 🏷️ **Smart Filename Parsing**: Automatically extracts names and job titles from filenames
- 🎯 **Intern Toggle**: Click cards to mark staff as "praktikant" (intern) with blue borders
- 📄 **Print-Optimized**: Generates perfect A4 layouts with intelligent card sizing
- ⚡ **Performance**: Lazy loading, image compression, and caching for smooth operation
- 🖨️ **Native Printing**: Uses browser's native print dialog for PDF generation

## Filename Format

Images should follow this naming pattern:
```
Firstname Lastname.jpg
Firstname Middlename Lastname.jpg
Firstname Lastname - Job Title.jpg
```

Examples:
- `John Doe.jpg`
- `Jane Mary Smith.jpg` 
- `Alice Johnson - Nurse Manager.jpg`

## Prerequisites

- **Node.js** (v16 or later)
- **Rust** (latest stable version)
- **Tauri CLI** tools

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd staff-list-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Install Tauri CLI** (if not already installed):
   ```bash
   npm install -g @tauri-apps/cli
   ```

## Development

**Start development server**:
```bash
npm run tauri dev
```

This will start both the React development server and the Tauri application.

## Building

**Build for production**:
```bash
npm run tauri build
```

The executable will be created in `src-tauri/target/release/`.

## Usage

1. **Launch the application**
2. **Add Images**: 
   - Click "Vælg mappe" to select a folder of images
   - Or click "Vælg billeder" to select individual files
3. **Manage Staff**:
   - Click on staff cards to toggle intern status (blue border)
   - Click the red X to remove staff members
4. **Edit Title**: Click on the main title to edit it
5. **Print**: Click "Gem til udskrift" to open the print dialog

## Technical Details

### Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Rust with Tauri 2.x
- **Icons**: Lucide React
- **Image Processing**: Rust `image` crate for compression and resizing

### Performance Optimizations
- **Lazy Loading**: Images load only when visible
- **Compression**: Images resized to max 400px and converted to JPEG
- **Caching**: In-memory cache prevents reprocessing
- **Intersection Observer**: Efficient viewport detection

### Project Structure
```
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── utils/             # Utility functions
│   └── types.ts           # TypeScript definitions
├── src-tauri/             # Rust backend
│   ├── src/main.rs        # Main Rust code
│   ├── Cargo.toml         # Rust dependencies
│   └── capabilities/      # Tauri permissions
└── public/                # Static assets
```

## Supported Formats

- **Images**: JPG, JPEG, PNG
- **Output**: A4 PDF via native browser printing

## Troubleshooting

### Common Issues

**"Image file does not exist" errors**:
- Ensure file paths don't contain special characters
- Check that image files are in supported formats

**Slow performance with many images**:
- The app automatically optimizes images, but very large collections (100+ images) may still be slow on older hardware

**Print preview doesn't match output**:
- Ensure browser zoom is set to 100%
- Check printer settings for proper A4 sizing

### Antivirus Warnings

The executable may trigger false positives from some antivirus software due to being unsigned. This is normal for unsigned applications. The app:
- Contains no malicious code
- Only accesses files you explicitly select
- Scores 3/71 on VirusTotal (very low false positive rate)

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions, please create an issue in the GitHub repository.