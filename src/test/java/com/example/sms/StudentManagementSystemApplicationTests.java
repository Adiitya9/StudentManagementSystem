package com.example.sms;

import com.example.sms.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class StudentManagementSystemApplicationTests {

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void contextLoadsAndStudentsSeeded() {
        long count = studentRepository.count();
        System.out.println("STUDENT REPOSITORY COUNT: " + count);
        assertTrue(count > 0, "Students should be seeded from data.sql");
    }

    @Test
    void loginAndFetchStudents() {
        // 1. Test Login
        com.example.sms.dto.LoginRequest loginRequest = new com.example.sms.dto.LoginRequest("admin", "admin123");
        ResponseEntity<com.example.sms.dto.AuthResponse> authResponse = restTemplate.postForEntity(
                "/api/auth/login", loginRequest, com.example.sms.dto.AuthResponse.class);

        assertEquals(org.springframework.http.HttpStatus.OK, authResponse.getStatusCode());
        assertNotNull(authResponse.getBody());
        String token = authResponse.getBody().getToken();
        assertNotNull(token);

        // 2. Fetch students with token
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setBearerAuth(token);
        org.springframework.http.HttpEntity<Void> entity = new org.springframework.http.HttpEntity<>(headers);

        ResponseEntity<String> studentsResponse = restTemplate.exchange(
                "/api/students", org.springframework.http.HttpMethod.GET, entity, String.class);

        System.out.println("GET /api/students status: " + studentsResponse.getStatusCode());
        System.out.println("GET /api/students body: " + (studentsResponse.getBody() != null ? studentsResponse.getBody().substring(0, Math.min(200, studentsResponse.getBody().length())) : "null"));
        assertEquals(org.springframework.http.HttpStatus.OK, studentsResponse.getStatusCode());
        assertTrue(studentsResponse.getBody().contains("Aarav Sharma"));
    }

    @Test
    void unauthenticatedVisitorCanFetchStudents() {
        // Visitors on Render without login should immediately see the student records
        ResponseEntity<String> response = restTemplate.getForEntity("/api/students", String.class);
        assertEquals(org.springframework.http.HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody().contains("Aarav Sharma"));
        assertTrue(response.getBody().contains("Priya Patel"));
    }
}
