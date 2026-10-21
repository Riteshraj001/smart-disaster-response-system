import axios from 'axios';
import { API_BASE_URL } from '../constants/incidentConstants';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Response interceptor for consistent and readable error messaging
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let statusCode = null;

    if (error.response) {
      statusCode = error.response.status;
      switch (statusCode) {
        case 400:
          errorMessage =
            error.response.data?.message ||
            'Please check the information you entered. Some fields are invalid.';
          break;
        case 404:
          errorMessage =
            error.response.data?.message || 'Incident not found on the server.';
          break;
        case 500:
          errorMessage =
            'Internal server error occurred on the Spring Boot backend.';
          break;
        default:
          errorMessage =
            error.response.data?.message ||
            `Server responded with status ${statusCode}.`;
      }
    } else if (error.request) {
      // The request was made but no response was received (backend down or CORS issue)
      errorMessage =
        'Unable to connect to the disaster management server at ' +
        API_BASE_URL +
        '. Please ensure your Spring Boot application is running and CORS is enabled.';
    } else {
      errorMessage = error.message;
    }

    const enhancedError = new Error(errorMessage);
    enhancedError.statusCode = statusCode;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  }
);

export default apiClient;
