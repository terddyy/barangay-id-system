/**
 * ID Card Generator Module
 * Handles all ID card generation, rendering, and management
 * 
 * @module idCardGenerator
 * @version 2.0.0
 * @author Barangay Holy Spirit Development Team
 */

class IDCardGenerator {
  constructor() {
    this.currentResidentId = null;
    this.currentResident = null;
    this.editMode = false;
    this.currentTheme = 'A';
    
    // DOM element references (will be initialized)
    this.elements = {
      // Front card elements
      front: null,
      frontFullName: null,
      frontRole: null,
      frontIdNumber: null,
      idPhoto: null,
      sigImg: null,
      
      // Back card elements
      back: null,
      backAddress: null,
      backContact: null,
      backPrecinct: null,
      backRole: null,
      barcodeSvg: null,
      chairwomanImg: null,
      
      // Controls
      templateSelect: null,
      editModeToggle: null,
      cardStatusBadge: null,
      
      // Edit overlays
      photoOverlay: null,
      signatureOverlay: null,
      chairwomanOverlay: null
    };
    
    console.log('📋 ID Card Generator initializing...');
  }

  /**
   * Initialize the generator - call this after DOM is loaded
   */
  init() {
    try {
      this.bindElements();
      this.setupEventListeners();
      this.loadSavedTheme();
      console.log('✅ ID Card Generator initialized successfully');
      console.log('📋 Use: IDCardGenerator.loadResident(residentId)');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ID Card Generator:', error);
      return false;
    }
  }

  /**
   * Bind all DOM elements
   * @private
   */
  bindElements() {
    // Front card elements
    this.elements.front = document.getElementById('idFront');
    this.elements.frontFullName = document.getElementById('frontFullName');
    this.elements.frontRole = document.getElementById('frontRole');
    this.elements.frontIdNumber = document.getElementById('frontIdNumber');
    this.elements.idPhoto = document.getElementById('idPhoto');
    this.elements.sigImg = document.getElementById('sigImg');
    
    // Back card elements
    this.elements.back = document.getElementById('idBack');
    this.elements.backAddress = document.getElementById('backAddress');
    this.elements.backContact = document.getElementById('backContact');
    this.elements.backPrecinct = document.getElementById('backPrecinct');
    this.elements.backRole = document.getElementById('backRole');
    this.elements.barcodeSvg = document.getElementById('barcodeSvg');
    this.elements.chairwomanImg = document.getElementById('chairwomanImg');
    
    // Controls
    this.elements.templateSelect = document.getElementById('templateSelect');
    this.elements.editModeToggle = document.getElementById('editModeToggle');
    this.elements.cardStatusBadge = document.getElementById('cardStatusBadge');
    
    // Edit overlays
    this.elements.photoOverlay = document.getElementById('photoEditOverlay');
    this.elements.signatureOverlay = document.getElementById('signatureEditOverlay');
    this.elements.chairwomanOverlay = document.getElementById('chairwomanEditOverlay');
    
    console.log('✅ DOM elements bound:', {
      hasFront: !!this.elements.front,
      hasBack: !!this.elements.back,
      hasControls: !!this.elements.templateSelect
    });
  }

  /**
   * Setup all event listeners
   * @private
   */
  setupEventListeners() {
    // Theme selector
    if (this.elements.templateSelect) {
      this.elements.templateSelect.addEventListener('change', () => {
        this.currentTheme = this.elements.templateSelect.value;
        this.applyTheme();
      });
    }
    
    // Edit mode toggle
    if (this.elements.editModeToggle) {
      this.elements.editModeToggle.addEventListener('change', (e) => {
        this.toggleEditMode(e.target.checked);
      });
    }
    
    // Setup image edit handlers
    this.setupImageEditHandlers();
    
    console.log('✅ Event listeners attached');
  }

  /**
   * Setup image editing handlers (photo, signature, chairwoman)
   * @private
   */
  setupImageEditHandlers() {
    // Photo handlers
    this.setupImageEditor({
      changeBtnId: 'changePhotoBtn',
      deleteBtnId: 'deletePhotoBtn',
      fileInputId: 'photoFileInput',
      imageElement: this.elements.idPhoto,
      label: 'Photo'
    });
    
    // Signature handlers
    this.setupImageEditor({
      changeBtnId: 'changeSignatureBtn',
      deleteBtnId: 'deleteSignatureBtn',
      fileInputId: 'signatureFileInput',
      imageElement: this.elements.sigImg,
      label: 'Signature'
    });
    
    // Chairwoman signature handlers
    this.setupImageEditor({
      changeBtnId: 'changeChairwomanBtn',
      deleteBtnId: 'deleteChairwomanBtn',
      fileInputId: 'chairwomanFileInput',
      imageElement: this.elements.chairwomanImg,
      label: 'Chairwoman Signature'
    });
  }

  /**
   * Setup a single image editor
   * @private
   */
  setupImageEditor(config) {
    const changeBtn = document.getElementById(config.changeBtnId);
    const deleteBtn = document.getElementById(config.deleteBtnId);
    const fileInput = document.getElementById(config.fileInputId);
    const imageElement = config.imageElement;
    
    if (changeBtn && fileInput) {
      changeBtn.addEventListener('click', () => {
        fileInput.click();
      });
      
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (imageElement) {
              imageElement.src = event.target.result;
              console.log(`✅ ${config.label} updated`);
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
    
    if (deleteBtn && imageElement) {
      deleteBtn.addEventListener('click', () => {
        if (confirm(`Delete ${config.label.toLowerCase()}?`)) {
          imageElement.src = '';
          console.log(`🗑️ ${config.label} deleted`);
        }
      });
    }
  }

  /**
   * Load and display a resident's ID card
   * @param {string|number} residentId - The resident's ID
   * @returns {Promise<boolean>} Success status
   */
  async loadResident(residentId) {
    console.log(`📋 Loading resident ${residentId} to ID card...`);
    
    try {
      // Fetch resident data (assumes ResidentService is available globally)
      if (typeof ResidentService === 'undefined') {
        throw new Error('ResidentService not available');
      }
      
      const resident = await ResidentService.getById(residentId);
      
      if (!resident) {
        throw new Error('Resident not found');
      }
      
      this.currentResident = resident;
      this.currentResidentId = residentId;
      
      // Populate the cards
      this.populateFrontCard(resident);
      this.populateBackCard(resident);
      this.generateBarcode(resident);
      this.updateStatusBadge(resident);
      
      // Apply current theme
      this.applyTheme();
      
      // Apply edit mode if toggle is on
      if (this.elements.editModeToggle) {
        this.toggleEditMode(this.elements.editModeToggle.checked);
      }
      
      console.log('✅ Resident loaded successfully:', {
        id: residentId,
        name: resident.fullName || resident.name,
        status: resident.status
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error loading resident:', error);
      alert(`Failed to load resident: ${error.message}`);
      return false;
    }
  }

  /**
   * Populate front card with resident data
   * @private
   */
  populateFrontCard(resident) {
    const { frontFullName, frontRole, frontIdNumber, idPhoto, sigImg } = this.elements;
    
    if (frontFullName) {
      frontFullName.textContent = resident.fullName || resident.name || '—';
    }
    
    if (frontRole) {
      const role = resident.purokOrPosition || resident.purok || 'RESIDENT';
      frontRole.textContent = role.toUpperCase();
    }
    
    if (frontIdNumber) {
      frontIdNumber.textContent = resident.idNumber || resident.idno || '—';
    }
    
    if (idPhoto) {
      const photoUrl = resident.photoUrl || resident.photo || '';
      idPhoto.src = this.normalizeImageUrl(photoUrl);
      idPhoto.alt = `Photo of ${resident.fullName || resident.name}`;
    }
    
    if (sigImg) {
      const sigUrl = resident.signatureUrl || resident.signature || '';
      sigImg.src = this.normalizeImageUrl(sigUrl);
      sigImg.alt = 'Resident signature';
    }
    
    console.log('✅ Front card populated');
  }

  /**
   * Populate back card with resident data
   * @private
   */
  populateBackCard(resident) {
    const { backAddress, backContact, backPrecinct, backRole } = this.elements;
    
    if (backAddress) {
      backAddress.textContent = resident.address || '—';
    }
    
    if (backContact) {
      backContact.textContent = resident.contact || '—';
    }
    
    if (backPrecinct) {
      backPrecinct.textContent = resident.precinctNumber || resident.household || '—';
    }
    
    if (backRole) {
      const role = resident.purokOrPosition || resident.purok || 'RESIDENT';
      backRole.textContent = role.toUpperCase();
    }
    
    console.log('✅ Back card populated');
  }

  /**
   * Generate barcode for the ID
   * @private
   */
  generateBarcode(resident) {
    if (typeof JsBarcode !== 'function') {
      console.warn('⚠️ JsBarcode not available, skipping barcode generation');
      return;
    }
    
    if (!this.elements.barcodeSvg) {
      console.warn('⚠️ Barcode SVG element not found');
      return;
    }
    
    try {
      const idNumber = resident.idNumber || resident.idno || 'N/A';
      JsBarcode(this.elements.barcodeSvg, idNumber, {
        format: 'CODE128',
        width: 1.4,
        height: 40,
        displayValue: false
      });
      console.log('✅ Barcode generated:', idNumber);
    } catch (error) {
      console.error('❌ Failed to generate barcode:', error);
    }
  }

  /**
   * Update status badge
   * @private
   */
  updateStatusBadge(resident) {
    if (!this.elements.cardStatusBadge) return;
    
    const status = (resident.status || 'pending').toLowerCase();
    
    if (status === 'released') {
      this.elements.cardStatusBadge.textContent = 'Released';
      this.elements.cardStatusBadge.className = 'tag green';
    } else {
      this.elements.cardStatusBadge.textContent = 'Pending';
      this.elements.cardStatusBadge.className = 'tag red';
    }
  }

  /**
   * Apply theme to both cards
   * @private
   */
  applyTheme() {
    if (!this.elements.front || !this.elements.back) {
      console.warn('⚠️ Card elements not found for theme application');
      return;
    }
    
    const theme = this.currentTheme;
    const frontClasses = `theme${theme}Front fade-ready`;
    const backClasses = `theme${theme}Back fade-ready`;
    
    // Remove existing classes and apply new ones
    this.elements.front.className = frontClasses;
    this.elements.back.className = backClasses;
    
    // Add fade-in animation
    setTimeout(() => {
      this.elements.front.classList.add('fade-in');
      this.elements.back.classList.add('fade-in');
    }, 50);
    
    // Save theme preference
    localStorage.setItem('selectedTheme', theme);
    
    // Update preview text if exists
    const previewText = document.getElementById('themePreviewText');
    if (previewText) {
      const themeNames = {
        A: 'Yellow / Official',
        B: 'Blue / Alternate',
        C: 'Black & Gold',
        D: 'Green / Nature',
        E: 'Red / Heritage',
        F: 'Purple / Modern',
        G: 'Orange / Sunset',
        H: 'Teal / Ocean'
      };
      previewText.textContent = `Currently: Theme ${theme} – ${themeNames[theme] || 'Unknown'}`;
    }
    
    console.log(`🎨 Theme ${theme} applied`);
  }

  /**
   * Toggle edit mode for the cards
   * @param {boolean} enabled - Whether to enable edit mode
   */
  toggleEditMode(enabled) {
    this.editMode = enabled;
    
    // Get all editable text fields
    const editableFields = document.querySelectorAll('[contenteditable]');
    
    // Toggle contenteditable
    editableFields.forEach(field => {
      field.contentEditable = enabled;
      if (enabled) {
        field.classList.add('edit-enabled');
        field.title = 'Click to edit this field';
      } else {
        field.classList.remove('edit-enabled');
        field.title = '';
      }
    });
    
    // Show/hide image edit overlays
    const overlays = [
      this.elements.photoOverlay,
      this.elements.signatureOverlay,
      this.elements.chairwomanOverlay
    ];
    
    overlays.forEach(overlay => {
      if (overlay) {
        overlay.style.display = enabled ? 'flex' : 'none';
      }
    });
    
    // Update status text
    const statusEl = document.getElementById('editModeStatus');
    if (statusEl) {
      statusEl.textContent = enabled ? 'Enabled' : 'Disabled';
      statusEl.style.color = enabled ? '#059669' : '#9ca3af';
    }
    
    console.log(`✏️ Edit mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Load saved theme from localStorage
   * @private
   */
  loadSavedTheme() {
    const saved = localStorage.getItem('selectedTheme');
    if (saved && this.elements.templateSelect) {
      this.elements.templateSelect.value = saved;
      this.currentTheme = saved;
      this.applyTheme();
      console.log(`📋 Loaded saved theme: ${saved}`);
    }
  }

  /**
   * Normalize image URL (handle relative paths, backend URLs, etc.)
   * @private
   */
  normalizeImageUrl(url) {
    if (!url) return '';
    
    // If it's already a full URL or data URL, return as-is
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    
    // If it starts with /uploads, prepend backend URL
    if (url.startsWith('/uploads')) {
      const backendUrl = 'http://localhost:3000';
      return `${backendUrl}${url}`;
    }
    
    return url;
  }

  /**
   * Get current resident data
   * @returns {Object|null} Current resident object
   */
  getCurrentResident() {
    return this.currentResident;
  }

  /**
   * Get current resident ID
   * @returns {string|number|null} Current resident ID
   */
  getCurrentResidentId() {
    return this.currentResidentId;
  }

  /**
   * Check if a resident is currently loaded
   * @returns {boolean}
   */
  hasResident() {
    return !!this.currentResidentId && !!this.currentResident;
  }

  /**
   * Validate that cards are ready for printing
   * @returns {Object} Validation result with status and message
   */
  validateForPrint() {
    if (!this.hasResident()) {
      return {
        valid: false,
        message: 'Please select a resident first'
      };
    }
    
    if (!this.elements.front || !this.elements.back) {
      return {
        valid: false,
        message: 'Card elements not found'
      };
    }
    
    if (!this.elements.front.innerHTML.trim() || !this.elements.back.innerHTML.trim()) {
      return {
        valid: false,
        message: 'Cards are empty - please generate ID first'
      };
    }
    
    return {
      valid: true,
      message: 'Ready to print'
    };
  }

  /**
   * Clear the current card display
   */
  clearCards() {
    // Reset text fields
    const textElements = [
      this.elements.frontFullName,
      this.elements.frontRole,
      this.elements.frontIdNumber,
      this.elements.backAddress,
      this.elements.backContact,
      this.elements.backPrecinct,
      this.elements.backRole
    ];
    
    textElements.forEach(el => {
      if (el) el.textContent = '—';
    });
    
    // Reset images
    const imageElements = [
      this.elements.idPhoto,
      this.elements.sigImg,
      this.elements.chairwomanImg
    ];
    
    imageElements.forEach(el => {
      if (el) el.src = '';
    });
    
    // Reset barcode
    if (this.elements.barcodeSvg) {
      this.elements.barcodeSvg.innerHTML = '';
    }
    
    // Reset state
    this.currentResident = null;
    this.currentResidentId = null;
    
    console.log('🗑️ Cards cleared');
  }
}

// Create singleton instance
const idCardGenerator = new IDCardGenerator();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    idCardGenerator.init();
  });
} else {
  idCardGenerator.init();
}

// Make globally available
if (typeof window !== 'undefined') {
  window.IDCardGenerator = idCardGenerator;
  console.log('✅ IDCardGenerator loaded and ready');
  console.log('📋 Available methods:', {
    loadResident: typeof idCardGenerator.loadResident,
    toggleEditMode: typeof idCardGenerator.toggleEditMode,
    validateForPrint: typeof idCardGenerator.validateForPrint,
    clearCards: typeof idCardGenerator.clearCards
  });
}

export default idCardGenerator;


