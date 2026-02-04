// API utility functions for handling network requests and errors

export const API_BASE_URL = import.meta.env.VITE_APP_URL || '/api';

// Generic error handler for API responses
export const handleApiError = (error, showNotification) => {
  if (!error.response) {
    // Network error
    showNotification.showError('Network error. Please check your connection and try again.');
    return;
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      showNotification.showError(data.message || 'Invalid request. Please check your input.');
      break;
    case 401:
      showNotification.showError('Unauthorized. Please log in again.');
      // Could redirect to login here
      break;
    case 403:
      showNotification.showError('Access forbidden. You do not have permission for this action.');
      break;
    case 404:
      showNotification.showError('Resource not found.');
      break;
    case 422:
      // Validation errors
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.message).join(', ');
        showNotification.showError(`Validation failed: ${errorMessages}`);
      } else {
        showNotification.showError(data.message || 'Validation failed. Please check your input.');
      }
      break;
    case 429:
      showNotification.showError('Too many requests. Please wait a moment and try again.');
      break;
    case 500:
      showNotification.showError('Server error. Please try again later.');
      break;
    default:
      showNotification.showError(data.message || 'An unexpected error occurred.');
  }
};

// Wrapper for API calls with error handling
export const apiCall = async (apiFunction, showNotification, options = {}) => {
  const { showLoading = false, loadingMessage = 'Loading...' } = options;

  try {
    if (showLoading && showNotification.showInfo) {
      showNotification.showInfo(loadingMessage, 0); // 0 = don't auto-dismiss
    }

    const result = await apiFunction();

    if (showLoading) {
      // Clear loading message
      // Note: In a real implementation, you'd track notification IDs
    }

    return result;
  } catch (error) {
    if (showLoading) {
      // Clear loading message
    }

    handleApiError(error, showNotification);
    throw error; // Re-throw so calling code can handle if needed
  }
};

// Simulate network delay for demo purposes
export const simulateNetworkDelay = (ms = 1000) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock API response wrapper
export const mockApiResponse = async (data, options = {}) => {
  const { delay = 1000, shouldFail = false, errorMessage = 'API Error' } = options;

  await simulateNetworkDelay(delay);

  if (shouldFail) {
    throw new Error(errorMessage);
  }

  return data;
};