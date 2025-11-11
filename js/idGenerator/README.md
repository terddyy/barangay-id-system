# ID Generator Module

This directory contains modular services for the Barangay Digital ID Generator system.

## 📁 Structure

```
js/idGenerator/
├── printService.js       # PVC ID card printing service
└── README.md            # This file
```

## 🖨️ Print Service

### Overview

The `printService.js` module handles all printing functionality for PVC ID cards (both front and back). It provides a clean, modular API for printing operations with built-in error handling and proper cleanup.

### Features

- ✅ **Modular Architecture**: Encapsulated class-based design
- ✅ **Clean API**: Simple methods for printing front/back cards
- ✅ **Error Handling**: Comprehensive validation and error messages
- ✅ **Auto Cleanup**: Automatic cleanup after print dialog closes
- ✅ **Interactive Element Removal**: Removes edit overlays and buttons before printing
- ✅ **Image Validation**: Ensures images are loaded and visible
- ✅ **Print State Management**: Prevents concurrent print operations
- ✅ **Configurable**: Adjustable delays and selectors

### Usage

#### Basic Usage

```javascript
// Print front card
await window.PrintService.printFront(currentResidentId);

// Print back card
await window.PrintService.printBack(currentResidentId);

// Generic print (specify side)
await window.PrintService.print('front', currentResidentId);
await window.PrintService.print('back', currentResidentId);
```

#### In Event Handlers

```javascript
document.getElementById('btnPrintFront').addEventListener('click', async () => {
  if (window.PrintService) {
    await window.PrintService.printFront(currentResidentId);
  }
});
```

#### Error Handling

```javascript
try {
  await window.PrintService.printFront(currentResidentId);
} catch (error) {
  console.error('Print failed:', error);
  // Handle error (service shows user-friendly alerts automatically)
}
```

### API Reference

#### Methods

##### `print(side, currentResidentId)`
Main print function that prints a PVC card side.

**Parameters:**
- `side` (string): Either `'front'` or `'back'`
- `currentResidentId` (string|number): ID of the currently loaded resident

**Returns:** `Promise<void>`

**Throws:** `Error` if validation fails or printing encounters an error

---

##### `printFront(currentResidentId)`
Convenience method to print the front card.

**Parameters:**
- `currentResidentId` (string|number): ID of the currently loaded resident

**Returns:** `Promise<void>`

---

##### `printBack(currentResidentId)`
Convenience method to print the back card.

**Parameters:**
- `currentResidentId` (string|number): ID of the currently loaded resident

**Returns:** `Promise<void>`

---

##### `isPrinting()`
Check if a print operation is currently in progress.

**Returns:** `boolean` - True if currently printing

---

##### `configure(newConfig)`
Update print service configuration.

**Parameters:**
- `newConfig` (Object): Configuration overrides

**Example:**
```javascript
window.PrintService.configure({
  printDelay: 150,  // Increase delay to 150ms
  cleanupDelay: 1500
});
```

---

##### `forceCleanup()`
Force cleanup of print state (useful for debugging or error recovery).

**Returns:** `void`

### Configuration

Default configuration can be overridden:

```javascript
{
  printDelay: 100,           // Delay before opening print dialog (ms)
  cleanupDelay: 1000,        // Fallback cleanup delay (ms)
  printContainerSelector: {
    front: '#printFrontWrapper',
    back: '#printBackWrapper'
  },
  cardSelector: {
    front: {
      live: '#idFront',
      print: '#printFrontCard'
    },
    back: {
      live: '#idBack',
      print: '#printBackCard'
    }
  },
  elementsToRemove: [
    '.photo-edit-overlay',
    '.signature-edit-overlay',
    '.chairwoman-edit-overlay',
    'input[type="file"]',
    'button',
    '#cardStatusBadge',
    '.tag'
  ]
}
```

### Architecture

#### Class: `PrintService`

**Private Properties:**
- `#config`: Configuration object
- `#isPrinting`: Boolean flag for print state
- `#cleanupHandler`: Reference to cleanup function

**Private Methods:**
- `#validateDOM()`: Validates required DOM elements exist
- `#setupEventListeners()`: Sets up browser event listeners
- `#createPrintableClone(element)`: Creates clean clone without interactive elements
- `#syncCardContent(side)`: Syncs live card to print container
- `#preparePrintContainers(side)`: Prepares containers for printing
- `#cleanup()`: Cleans up after printing
- `#validateResidentLoaded(id)`: Validates resident is loaded

**Public Methods:**
- `print(side, residentId)`: Main print function
- `printFront(residentId)`: Print front card
- `printBack(residentId)`: Print back card
- `isPrinting()`: Check print status
- `configure(config)`: Update configuration
- `forceCleanup()`: Force cleanup

### Workflow

1. **User clicks print button**
2. **Validation**: Service validates resident is loaded
3. **Clone**: Creates clean clone of live card (removes interactive elements)
4. **Sync**: Copies content to print container
5. **Prepare**: Shows only the target print container
6. **Print**: Opens browser print dialog
7. **Cleanup**: Automatically cleans up after printing

### Error Handling

The service handles several error scenarios:

- **No resident loaded**: Shows user-friendly message with instructions
- **Invalid side parameter**: Throws error with valid options
- **Concurrent print requests**: Ignores subsequent requests while printing
- **Missing DOM elements**: Logs warnings and throws descriptive errors
- **Clone failures**: Catches and reports errors

### Dependencies

- **Required DOM Elements:**
  - `#idFront` - Live front card element
  - `#idBack` - Live back card element
  - `#printFrontWrapper` - Front print container
  - `#printBackWrapper` - Back print container
  - `#printFrontCard` - Front print card
  - `#printBackCard` - Back print card

- **CSS Classes:**
  - `.hidden` - Hide elements
  - `.printing-now` - Mark element as currently printing

- **Print CSS:** Requires `@media print` styles in the main stylesheet

### Best Practices

1. **Always check service availability:**
   ```javascript
   if (window.PrintService) {
     // Use service
   }
   ```

2. **Use async/await:**
   ```javascript
   await window.PrintService.printFront(id);
   ```

3. **Don't call during printing:**
   ```javascript
   if (!window.PrintService.isPrinting()) {
     await window.PrintService.printFront(id);
   }
   ```

4. **Handle errors gracefully:**
   ```javascript
   try {
     await window.PrintService.printFront(id);
   } catch (error) {
     // Service shows alerts, but you can add custom handling
   }
   ```

### Debugging

Enable detailed logging:

```javascript
// Check if service is loaded
console.log('PrintService loaded:', !!window.PrintService);

// Check print status
console.log('Is printing:', window.PrintService.isPrinting());

// Force cleanup if stuck
window.PrintService.forceCleanup();
```

### Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ⚠️ Internet Explorer (not tested, may require polyfills)

### Version History

**v1.0.0** (November 11, 2025)
- Initial modular implementation
- Extracted from monolithic coreA.html
- Added comprehensive error handling
- Implemented proper cleanup with afterprint event
- Added configuration support
- Complete JSDoc documentation

---

## 🔮 Future Enhancements

- [ ] Add print preview functionality
- [ ] Support for custom templates
- [ ] Batch printing (multiple cards)
- [ ] Print queue management
- [ ] Export to PDF functionality
- [ ] Print history logging
- [ ] Custom watermarks
- [ ] Print settings persistence

## 📝 Contributing

When adding new features to the ID Generator module:

1. Create a new service file in this directory
2. Use class-based architecture with private/public members
3. Add comprehensive JSDoc documentation
4. Update this README with usage instructions
5. Handle errors gracefully
6. Add validation for inputs
7. Provide public API that's easy to use
8. Export as singleton when appropriate

## 📄 License

Part of the Barangay Holy Spirit Digital ID System
© 2025 Barangay Holy Spirit Development Team


