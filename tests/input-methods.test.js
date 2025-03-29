import { fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';

describe('Input Methods', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="app">
        <div id="addModal">
          <input id="itemInput" type="text">
          <button id="voiceInput">Voice Input</button>
          <button id="cameraInput">Camera Input</button>
          <button id="galleryInput">Gallery Input</button>
          <div id="imagePreview" class="hidden">
            <img id="previewImage" src="">
            <div id="imageOverlay"></div>
          </div>
        </div>
      </div>
    `;
  });

  describe('Voice Input', () => {
    let recognition;

    beforeEach(() => {
      // Mock Web Speech API
      recognition = {
        start: jest.fn(),
        stop: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        continuous: false,
        interimResults: true
      };

      global.webkitSpeechRecognition = jest.fn(() => recognition);
    });

    test('should initialize voice recognition when button clicked', () => {
      require('../app.js');
      
      const voiceInputBtn = document.getElementById('voiceInput');
      fireEvent.click(voiceInputBtn);
      
      expect(recognition.start).toHaveBeenCalled();
      expect(voiceInputBtn).toHaveClass('opacity-75', 'cursor-not-allowed');
      expect(voiceInputBtn).toBeDisabled();
    });

    test('should handle successful voice recognition', () => {
      require('../app.js');
      
      const voiceInputBtn = document.getElementById('voiceInput');
      const itemInput = document.getElementById('itemInput');
      
      fireEvent.click(voiceInputBtn);
      
      // Simulate recognition result
      const resultEvent = {
        resultIndex: 0,
        results: [[{ transcript: 'milk', isFinal: true }]]
      };
      
      recognition.onresult(resultEvent);
      
      expect(itemInput.value).toBe('milk');
    });

    test('should handle voice recognition errors', () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      require('../app.js');
      
      const voiceInputBtn = document.getElementById('voiceInput');
      fireEvent.click(voiceInputBtn);
      
      // Simulate no-speech error
      recognition.onerror({ error: 'no-speech' });
      
      expect(alertMock).toHaveBeenCalledWith('No speech detected. Please try again.');
      expect(voiceInputBtn).not.toHaveClass('opacity-75', 'cursor-not-allowed');
      expect(voiceInputBtn).not.toBeDisabled();
    });
  });

  describe('Camera Input', () => {
    let createElementSpy;
    let clickSpy;

    beforeEach(() => {
      // Mock file input creation and click
      createElementSpy = jest.spyOn(document, 'createElement');
      clickSpy = jest.fn();
      createElementSpy.mockReturnValue({
        click: clickSpy,
        setAttribute: jest.fn()
      });
    });

    test('should create file input with camera capture when button clicked', () => {
      require('../app.js');
      
      const cameraInputBtn = document.getElementById('cameraInput');
      fireEvent.click(cameraInputBtn);
      
      expect(createElementSpy).toHaveBeenCalledWith('input');
      const fileInput = createElementSpy.mock.results[0].value;
      expect(fileInput.type).toBe('file');
      expect(fileInput.accept).toBe('image/*');
      expect(fileInput.capture).toBe('environment');
      expect(clickSpy).toHaveBeenCalled();
    });

    test('should process captured image', () => {
      require('../app.js');
      
      const cameraInputBtn = document.getElementById('cameraInput');
      fireEvent.click(cameraInputBtn);
      
      const fileInput = createElementSpy.mock.results[0].value;
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock URL.createObjectURL
      const mockURL = 'blob:test-url';
      URL.createObjectURL = jest.fn().mockReturnValue(mockURL);
      
      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      const imagePreview = document.getElementById('imagePreview');
      const previewImage = document.getElementById('previewImage');
      
      expect(imagePreview).not.toHaveClass('hidden');
      expect(previewImage.src).toBe(mockURL);
    });
  });

  describe('Gallery Input', () => {
    let createElementSpy;
    let clickSpy;

    beforeEach(() => {
      // Mock file input creation and click
      createElementSpy = jest.spyOn(document, 'createElement');
      clickSpy = jest.fn();
      createElementSpy.mockReturnValue({
        click: clickSpy,
        setAttribute: jest.fn()
      });
    });

    test('should create file input for gallery when button clicked', () => {
      require('../app.js');
      
      const galleryInputBtn = document.getElementById('galleryInput');
      fireEvent.click(galleryInputBtn);
      
      expect(createElementSpy).toHaveBeenCalledWith('input');
      const fileInput = createElementSpy.mock.results[0].value;
      expect(fileInput.type).toBe('file');
      expect(fileInput.accept).toBe('image/*');
      expect(fileInput.capture).toBeUndefined();
      expect(clickSpy).toHaveBeenCalled();
    });

    test('should handle image processing errors', () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      require('../app.js');
      
      const galleryInputBtn = document.getElementById('galleryInput');
      fireEvent.click(galleryInputBtn);
      
      const fileInput = createElementSpy.mock.results[0].value;
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock URL.createObjectURL to throw error
      URL.createObjectURL = jest.fn(() => {
        throw new Error('Failed to create object URL');
      });
      
      // Simulate file selection
      fireEvent.change(fileInput, { target: { files: [file] } });
      
      expect(alertMock).toHaveBeenCalledWith(
        expect.stringContaining('Error processing image')
      );
    });
  });

  describe('Image Processing', () => {
    test('should scale large images', () => {
      require('../app.js');
      
      const imagePreview = document.getElementById('imagePreview');
      const imageOverlay = document.getElementById('imageOverlay');
      
      // Create a test image that's larger than MAX_SIZE (1024)
      const testImage = new Image();
      testImage.width = 2048;
      testImage.height = 1536;
      
      // Mock canvas and context
      const mockContext = {
        drawImage: jest.fn()
      };
      const mockCanvas = {
        getContext: jest.fn(() => mockContext),
        width: 0,
        height: 0
      };
      
      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas);
      
      // Process the image
      const { processImage } = require('../app.js');
      processImage(new File([''], 'test.jpg', { type: 'image/jpeg' }));
      
      // Verify image was scaled properly
      expect(mockCanvas.width).toBe(1024);
      expect(mockCanvas.height).toBe(768);
      expect(mockContext.drawImage).toHaveBeenCalledWith(
        expect.any(Image),
        0,
        0,
        1024,
        768
      );
    });
  });
});