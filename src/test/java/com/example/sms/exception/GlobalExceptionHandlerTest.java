package com.example.sms.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GlobalExceptionHandlerTest {

    private static final String REQUEST_PATH = "/api/students/42";

    private final GlobalExceptionHandler exceptionHandler = new GlobalExceptionHandler();

    @Test
    void handleResourceNotFoundShouldReturnNotFoundResponse() {
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleResourceNotFound(
                new ResourceNotFoundException("Student not found"), request());

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertCommonFields(response.getBody(), HttpStatus.NOT_FOUND, "Not Found", REQUEST_PATH);
        assertEquals("Student not found", response.getBody().getMessage());
    }

    @Test
    void handleValidationExceptionShouldReturnFieldErrors() throws Exception {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "request");
        bindingResult.addError(new FieldError("request", "name", "must not be blank"));
        MethodParameter methodParameter = new MethodParameter(
                GlobalExceptionHandlerTest.class.getDeclaredMethod("accept", Object.class), 0);
        MethodArgumentNotValidException exception = new MethodArgumentNotValidException(
                methodParameter, bindingResult);

        ResponseEntity<ErrorResponse> response = exceptionHandler.handleValidationExceptions(
                exception, request());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertCommonFields(response.getBody(), HttpStatus.BAD_REQUEST, "Validation Failed", REQUEST_PATH);
        assertEquals("One or more fields have validation errors", response.getBody().getMessage());
        assertEquals(Map.of("name", "must not be blank"), response.getBody().getValidationErrors());
    }

    @Test
    void handleIllegalArgumentShouldReturnBadRequestResponse() {
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleIllegalArgument(
                new IllegalArgumentException("Invalid student identifier"), request());

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertCommonFields(response.getBody(), HttpStatus.BAD_REQUEST, "Bad Request", REQUEST_PATH);
        assertEquals("Invalid student identifier", response.getBody().getMessage());
    }

    @Test
    void handleGeneralExceptionShouldReturnInternalServerErrorResponse() {
        ResponseEntity<ErrorResponse> response = exceptionHandler.handleGeneralException(
                new IllegalStateException("Unexpected failure"), request());

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertCommonFields(response.getBody(), HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal Server Error", REQUEST_PATH);
        assertEquals("An unexpected error occurred: Unexpected failure", response.getBody().getMessage());
    }

    private static HttpServletRequest request() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI(REQUEST_PATH);
        return request;
    }

    private static void assertCommonFields(
            ErrorResponse response, HttpStatus status, String error, String path) {
        assertNotNull(response);
        assertNotNull(response.getTimestamp());
        assertEquals(status.value(), response.getStatus());
        assertEquals(error, response.getError());
        assertEquals(path, response.getPath());
    }

    private void accept(Object request) {
    }
}
