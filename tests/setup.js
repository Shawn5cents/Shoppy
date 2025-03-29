// Configure Jest DOM testing utilities
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock Geolocation API
const geolocationMock = {
  getCurrentPosition: jest.fn(),
  watchPosition: jest.fn()
};
global.navigator.geolocation = geolocationMock;

// Mock Notification API
global.Notification = {
  requestPermission: jest.fn(),
  permission: 'granted'
};

// Mock fetch API
global.fetch = jest.fn();

// DOM environment setup
document.body.innerHTML = `
<div id="app">
  <button id="addListBtn">Add List</button>
  <div id="locationModal" class="hidden"></div>
  <div id="addModal" class="hidden"></div>
  <div id="lists"></div>
</div>
`;