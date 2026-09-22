package com.example.sms.controller;

import com.example.sms.dto.StudentRequest;
import com.example.sms.dto.StudentResponse;
import com.example.sms.exception.ResourceNotFoundException;
import com.example.sms.service.StudentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentService studentService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getAllStudents_shouldReturnOkAndList() throws Exception {
        StudentResponse s1 = StudentResponse.builder().id(1L).name("Alice").email("alice@example.com").phone("1234567890").build();
        when(studentService.getAllStudents()).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Alice"));
    }

    @Test
    void getStudentById_whenFound_shouldReturnOk() throws Exception {
        StudentResponse s1 = StudentResponse.builder().id(1L).name("Alice").email("alice@example.com").phone("1234567890").build();
        when(studentService.getStudentById(1L)).thenReturn(s1);

        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice"));
    }

    @Test
    void getStudentById_whenNotFound_shouldReturn404() throws Exception {
        when(studentService.getStudentById(99L)).thenThrow(new ResourceNotFoundException("Student not found with id: 99"));

        mockMvc.perform(get("/api/students/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Student not found with id: 99"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void createStudent_withValidData_shouldReturnCreated() throws Exception {
        StudentRequest req = StudentRequest.builder()
                .name("Bob")
                .email("bob@example.com")
                .phone("1234567890")
                .build();

        StudentResponse res = StudentResponse.builder()
                .id(2L)
                .name("Bob")
                .email("bob@example.com")
                .phone("1234567890")
                .build();

        when(studentService.createStudent(any(StudentRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Bob"));
    }

    @Test
    void createStudent_withInvalidEmail_shouldReturnBadRequest() throws Exception {
        StudentRequest invalidReq = StudentRequest.builder()
                .name("Bob")
                .email("not-an-email")
                .phone("1234567890")
                .build();

        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    void deleteStudent_shouldReturnNoContent() throws Exception {
        doNothing().when(studentService).deleteStudent(1L);

        mockMvc.perform(delete("/api/students/1"))
                .andExpect(status().isNoContent());

        verify(studentService, times(1)).deleteStudent(1L);
    }
}
