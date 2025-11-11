/**
 * PVC ID Card Print Service V2
 * Simple, reliable printing using hidden iframe approach
 * 
 * @version 2.0.0
 */

class PrintServiceV2 {
  constructor() {
    this.isPrinting = false;
    this.printFrame = null;
    console.log('✅ Print Service V2 initialized');
  }

  /**
   * Gets the complete CSS needed for printing
   * @private
   */
  getPrintStyles() {
    return `
      <style>
        /* Reset */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Page setup */
        @page {
          size: A4;
          margin: 0;
        }

        body {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        /* Card container */
        .print-card-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        /* Card styles - scaled to print size */
        #idFront, #idBack {
          width: 340px !important;
          height: 540px !important;
          transform: scale(0.5) !important;
          transform-origin: center center !important;
          border-radius: 14px !important;
          overflow: hidden !important;
          box-shadow: none !important;
          page-break-inside: avoid !important;
          page-break-after: avoid !important;
          page-break-before: avoid !important;
          display: flex !important;
          flex-direction: column !important;
        }

        /* Make sure all content is visible */
        #idFront *, #idBack * {
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Image handling */
        #idFront img, #idBack img {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }

        /* Hide any edit overlays or buttons */
        .photo-edit-overlay,
        .signature-edit-overlay,
        .chairwoman-edit-overlay,
        input[type="file"],
        button,
        .tag {
          display: none !important;
        }

        /* Theme A Front styles */
        .themeAFront {
          background: radial-gradient(circle at top left, #fffceb 0%, #ffef6b 60%, #ffd000 100%) !important;
          border: 2px solid #000 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #000 !important;
        }

        /* Theme A Back styles */
        .themeABack {
          background: radial-gradient(circle at top left, #fffceb 0%, #ffef6b 60%, #ffd000 100%) !important;
          border: 2px solid #000 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #000 !important;
        }

        /* Theme B Front styles */
        .themeBFront {
          background: radial-gradient(circle at top left, #e8f4ff 0%, #60a5fa 60%, #2563eb 100%) !important;
          border: 2px solid #000 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #000 !important;
        }

        /* Theme B Back styles */
        .themeBBack {
          background: radial-gradient(circle at top left, #e8f4ff 0%, #60a5fa 60%, #2563eb 100%) !important;
          border: 2px solid #000 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #000 !important;
        }

        /* Theme C Front styles */
        .themeCFront {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #ffd700 100%) !important;
          border: 2px solid #ffd700 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #fff !important;
        }

        /* Theme C Back styles */
        .themeCBack {
          background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #ffd700 100%) !important;
          border: 2px solid #ffd700 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #fff !important;
        }

        /* Theme D Front styles (Green / Nature) */
        .themeDFront {
          background: linear-gradient(135deg, #e8f5e9 0%, #81c784 50%, #388e3c 100%) !important;
          border: 2px solid #2e7d32 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #1b5e20 !important;
        }

        /* Theme D Back styles */
        .themeDBack {
          background: linear-gradient(135deg, #e8f5e9 0%, #81c784 50%, #388e3c 100%) !important;
          border: 2px solid #2e7d32 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #1b5e20 !important;
        }

        /* Theme E Front styles (Red / Heritage) */
        .themeEFront {
          background: linear-gradient(135deg, #ffebee 0%, #ef5350 50%, #c62828 100%) !important;
          border: 2px solid #b71c1c !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #b71c1c !important;
        }

        /* Theme E Back styles */
        .themeEBack {
          background: linear-gradient(135deg, #ffebee 0%, #ef5350 50%, #c62828 100%) !important;
          border: 2px solid #b71c1c !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #b71c1c !important;
        }

        /* Theme F Front styles (Purple / Modern) */
        .themeFront {
          background: linear-gradient(135deg, #f3e5f5 0%, #ab47bc 50%, #6a1b9a 100%) !important;
          border: 2px solid #4a148c !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #4a148c !important;
        }

        /* Theme F Back styles */
        .themeFBack {
          background: linear-gradient(135deg, #f3e5f5 0%, #ab47bc 50%, #6a1b9a 100%) !important;
          border: 2px solid #4a148c !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #4a148c !important;
        }

        /* Theme G Front styles (Orange / Sunset) */
        .themeGFront {
          background: linear-gradient(135deg, #fff3e0 0%, #ff9800 50%, #e65100 100%) !important;
          border: 2px solid #bf360c !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #bf360c !important;
        }

        /* Theme G Back styles */
        .themeGBack {
          background: linear-gradient(135deg, #fff3e0 0%, #ff9800 50%, #e65100 100%) !important;
          border: 2px solid #bf360c !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #bf360c !important;
        }

        /* Theme H Front styles (Teal / Ocean) */
        .themeHFront {
          background: linear-gradient(135deg, #e0f2f1 0%, #26a69a 50%, #00695c 100%) !important;
          border: 2px solid #004d40 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #004d40 !important;
        }

        /* Theme H Back styles */
        .themeHBack {
          background: linear-gradient(135deg, #e0f2f1 0%, #26a69a 50%, #00695c 100%) !important;
          border: 2px solid #004d40 !important;
          padding: 10px 14px !important;
          font-family: Arial, sans-serif !important;
          color: #004d40 !important;
        }

        /* Front card structure */
        .front-logos {
          display: flex !important;
          justify-content: space-between !important;
          align-items: flex-start !important;
          margin-bottom: 6px !important;
          gap: 8px !important;
        }

        .front-logo {
          width: 40px !important;
          height: 40px !important;
          object-fit: contain !important;
        }

        .front-headerband {
          background: #000 !important;
          color: #fff !important;
          text-align: center !important;
          padding: 6px !important;
          border-radius: 6px !important;
          margin-bottom: 8px !important;
        }

        .bgy-name {
          font-weight: 800 !important;
          font-size: 13px !important;
          color: #fff !important;
        }

        .bgy-addr {
          font-style: italic !important;
          font-size: 10px !important;
          font-weight: normal !important;
          color: #ddd !important;
        }

        .front-photo {
          margin: 16px auto 6px !important;
          width: 140px !important;
          height: 180px !important;
          border: 2px solid #000 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          background: #f0f0f0 !important;
        }

        .front-photo img {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }

        .front-nameblock {
          text-align: center !important;
          margin-top: 10px !important;
        }

        .person-name {
          font-weight: 800 !important;
          font-size: 16px !important;
          line-height: 1.2 !important;
          margin: 4px 0 !important;
        }

        .person-role {
          font-size: 11px !important;
          font-weight: 600 !important;
          background: rgba(0,0,0,0.1) !important;
          padding: 3px 8px !important;
          border-radius: 4px !important;
          display: inline-block !important;
          margin-top: 4px !important;
        }

        .front-idnumber {
          text-align: center !important;
          font-size: 14px !important;
          font-weight: 800 !important;
          margin: 8px 0 !important;
          letter-spacing: 1px !important;
        }

        .front-signature-wrapper {
          margin-top: 20px !important;
          text-align: center !important;
        }

        .front-signature-img {
          width: 140px !important;
          height: 40px !important;
          object-fit: contain !important;
          margin: 0 auto !important;
          display: block !important;
          border-bottom: 1px solid #000 !important;
          background: #fff !important;
        }

        .front-signature-label {
          font-size: 11px !important;
          margin-top: 2px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
        }

        /* Back card structure */
        .back-contact-block {
          background: rgba(0,0,0,0.05) !important;
          padding: 8px !important;
          border-radius: 6px !important;
          margin: 10px 0 !important;
          font-size: 11px !important;
        }

        .back-line {
          margin: 4px 0 !important;
          font-size: 11px !important;
        }

        .back-line strong {
          font-weight: 700 !important;
          display: inline-block !important;
          min-width: 80px !important;
        }

        .back-barcode-block {
          text-align: center !important;
          margin: 12px 0 !important;
        }

        .back-barcode-block svg {
          width: 180px !important;
          height: 45px !important;
          margin: 0 auto !important;
        }

        .back-disclaimer {
          font-size: 9px !important;
          line-height: 1.3 !important;
          text-align: center !important;
          margin: 12px 0 !important;
          font-style: italic !important;
        }

        .back-chairwoman-block {
          text-align: center !important;
          margin-top: 16px !important;
        }

        .chairwoman-sig {
          width: 120px !important;
          height: 35px !important;
          margin: 0 auto !important;
          display: block !important;
          object-fit: contain !important;
        }

        .chairwoman-label {
          font-size: 10px !important;
          margin-top: 2px !important;
          font-weight: 700 !important;
        }

        .chairwoman-name {
          font-size: 11px !important;
          font-weight: 800 !important;
          text-transform: uppercase !important;
        }

        .chairwoman-title {
          font-size: 9px !important;
          margin-top: 0 !important;
        }

        /* Back card specific elements */
        .back-confirmation-title {
          text-align: center !important;
          font-weight: 800 !important;
          font-size: 12px !important;
          margin: 10px 0 !important;
          text-decoration: underline !important;
        }

        .back-body-text {
          font-size: 9px !important;
          line-height: 1.4 !important;
          text-align: justify !important;
          margin: 8px 0 !important;
        }

        .back-expiry {
          text-align: center !important;
          font-size: 10px !important;
          font-weight: 700 !important;
          margin: 10px 0 !important;
        }

        .back-sig-captain {
          margin-top: 12px !important;
          text-align: center !important;
        }

        .captain-signature-line {
          position: relative !important;
          display: inline-block !important;
          width: 150px !important;
          height: 40px !important;
          border-bottom: 1px solid #000 !important;
          margin: 0 auto !important;
        }

        .captain-signature-img {
          width: 140px !important;
          height: 35px !important;
          object-fit: contain !important;
          display: block !important;
          margin: 0 auto !important;
        }

        .captain-name {
          font-size: 10px !important;
          font-weight: 700 !important;
          margin-top: 4px !important;
          line-height: 1.3 !important;
          text-align: center !important;
        }

        /* Ensure all text is visible */
        * {
          color: inherit !important;
        }
      </style>
    `;
  }

  /**
   * Creates a hidden iframe for printing
   * @private
   */
  createPrintFrame() {
    // Remove existing frame if any
    if (this.printFrame) {
      document.body.removeChild(this.printFrame);
    }

    // Create new iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '210mm';
    iframe.style.height = '297mm';
    
    document.body.appendChild(iframe);
    this.printFrame = iframe;
    
    return iframe;
  }

  /**
   * Gets card HTML content without interactive elements
   * @private
   * @returns {Object} Object with cardHTML (outer element) and cardClasses
   */
  getCleanCardHTML(cardElement) {
    if (!cardElement) {
      throw new Error('Card element not found');
    }

    // Clone the card (FULL element, not just innerHTML)
    const clone = cardElement.cloneNode(true);

    // Remove interactive elements
    const toRemove = clone.querySelectorAll(
      '.photo-edit-overlay, .signature-edit-overlay, .chairwoman-edit-overlay, ' +
      'input[type="file"], button, .tag, #cardStatusBadge'
    );
    toRemove.forEach(el => el.remove());

    // Ensure all images have proper src
    const images = clone.querySelectorAll('img');
    images.forEach(img => {
      if (img.src && img.src.startsWith('blob:')) {
        // Keep blob URLs as-is, they should work
      }
      // Make sure images are visible
      img.style.display = 'block';
      img.style.visibility = 'visible';
      img.style.opacity = '1';
    });

    // Return the OUTER HTML (includes the card div with classes and styling)
    return {
      outerHTML: clone.outerHTML,
      classes: clone.className
    };
  }

  /**
   * Main print function
   * @param {string} side - 'front' or 'back'
   */
  async print(side) {
    if (this.isPrinting) {
      console.warn('⚠️ Already printing, please wait...');
      return;
    }

    if (!['front', 'back'].includes(side)) {
      throw new Error('Invalid side. Use "front" or "back"');
    }

    this.isPrinting = true;
    console.log(`🖨️ Starting ${side} card print...`);

    try {
      // Get the card element
      const cardId = side === 'front' ? '#idFront' : '#idBack';
      const cardElement = document.querySelector(cardId);

      if (!cardElement) {
        throw new Error(`Card element ${cardId} not found. Please generate an ID first.`);
      }

      // Check if card has content
      if (!cardElement.innerHTML.trim()) {
        throw new Error('Card is empty. Please generate an ID first.');
      }

      console.log(`📋 Found ${side} card with content`);

      // Get clean HTML (includes the outer card element with styling)
      const cardData = this.getCleanCardHTML(cardElement);

      // Create iframe
      const iframe = this.createPrintFrame();
      const iframeDoc = iframe.contentWindow.document;

      // Build complete HTML document
      const printDocument = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Print ${side.toUpperCase()} Card</title>
          ${this.getPrintStyles()}
        </head>
        <body>
          <div class="print-card-container">
            ${cardData.outerHTML}
          </div>
        </body>
        </html>
      `;

      // Write to iframe
      iframeDoc.open();
      iframeDoc.write(printDocument);
      iframeDoc.close();

      console.log('✅ Print document prepared');

      // Wait for images to load
      await this.waitForImages(iframeDoc);

      console.log('✅ Images loaded, opening print dialog...');

      // Small delay to ensure rendering is complete
      await new Promise(resolve => setTimeout(resolve, 300));

      // Print
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      console.log('✅ Print dialog opened');

      // Cleanup after a delay
      setTimeout(() => {
        this.cleanup();
      }, 1000);

    } catch (error) {
      console.error('❌ Print error:', error);
      alert(`Failed to print: ${error.message}`);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Wait for all images in document to load
   * @private
   */
  waitForImages(doc) {
    return new Promise((resolve) => {
      const images = doc.querySelectorAll('img');
      
      if (images.length === 0) {
        resolve();
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          console.log(`✅ All ${totalImages} images loaded`);
          resolve();
        }
      };

      images.forEach(img => {
        if (img.complete) {
          checkComplete();
        } else {
          img.addEventListener('load', checkComplete);
          img.addEventListener('error', () => {
            console.warn('⚠️ Image failed to load:', img.src);
            checkComplete();
          });
        }
      });

      // Timeout fallback
      setTimeout(() => {
        console.log('⚠️ Image load timeout, proceeding anyway');
        resolve();
      }, 3000);
    });
  }

  /**
   * Cleanup function
   * @private
   */
  cleanup() {
    if (this.printFrame && this.printFrame.parentNode) {
      document.body.removeChild(this.printFrame);
      this.printFrame = null;
    }
    this.isPrinting = false;
    console.log('✅ Print cleanup completed');
  }

  /**
   * Convenience methods
   */
  async printFront() {
    return this.print('front');
  }

  async printBack() {
    return this.print('back');
  }

  /**
   * Force cleanup (for debugging)
   */
  forceCleanup() {
    console.log('⚠️ Force cleanup requested');
    this.cleanup();
  }
}

// Export singleton
const printServiceV2 = new PrintServiceV2();

// Make globally available
if (typeof window !== 'undefined') {
  window.PrintServiceV2 = printServiceV2;
  console.log('✅ PrintService V2 loaded and ready');
  console.log('📋 Usage: PrintServiceV2.print("front") or PrintServiceV2.print("back")');
}

export default printServiceV2;

