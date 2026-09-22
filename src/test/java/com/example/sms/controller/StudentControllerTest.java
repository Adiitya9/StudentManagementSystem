package com.example.sms.controller;

import com.example.sms.dto.StudentRequest;
import com.example.sms.dto.StudentResponse;
import com.example.sms.exception.ResourceNotFoundException;
import com.example.sms.security.JwtTokenProvider;
import com.example.sms.service.StudentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.List;

import org.springframework.context.annotation.Import;
import com.example.sms.security.JwtAuthenticationFilter;
import com.example.sms.security.SecurityConfig;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(StudentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentService studentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getAllStudents_shouldReturnOkAndList() throws Exception {
        StudentResponse s1 = StudentResponse.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .phone("1234567890")
                .department("Computer Science")
                .gpa(3.8)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        when(studentService.getAllStudents()).thenReturn(List.of(s1));

        mockMvc.perform(get("/api/students"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Alice"))
                .andExpect(jsonPath("$[0].department").value("Computer Science"))
                .andExpect(jsonPath("$[0].gpa").value(3.8));
    }

    @Test
    @WithMockUser(authorities = "ROLE_STUDENT")
    void getStudentById_whenFound_shouldReturnOkForStudent() throws Exception {
        StudentResponse s1 = StudentResponse.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .phone("1234567890")
                .department("Computer Science")
                .gpa(3.8)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        when(studentService.getStudentById(1L)).thenReturn(s1);

        mockMvc.perform(get("/api/students/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alice"))
                .andExpect(jsonPath("$.department").value("Computer Science"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getStudentById_whenNotFound_shouldReturn404() throws Exception {
        when(studentService.getStudentById(99L)).thenThrow(new ResourceNotFoundException("Student not found with id: 99"));

        mockMvc.perform(get("/api/students/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Student not found with id: 99"))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createStudent_withValidData_shouldReturnCreated() throws Exception {
        StudentRequest req = StudentRequest.builder()
                .name("Bob")
                .email("bob@example.com")
                .phone("1234567890")
                .department("Mathematics")
                .gpa(3.6)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        StudentResponse res = StudentResponse.builder()
                .id(2L)
                .name("Bob")
                .email("bob@example.com")
                .phone("1234567890")
                .department("Mathematics")
                .gpa(3.6)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        when(studentService.createStudent(any(StudentRequest.class))).thenReturn(res);

        mockMvc.perform(post("/api/students")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.name").value("Bob"))
                .andExpect(jsonPath("$.department").value("Mathematics"))
                .andExpect(jsonPath("$.gpa").value(3.6));
    }

    @Test
    @WithMockUser(authorities = "ROLE_STUDENT")
    void createStudent_whenRoleStudent_shouldReturnForbidden() throws Exception {
        StudentRequest req = StudentRequest.builder()
                .name("Bob")
                .email("bob@example.com")
                .phone("1234567890")
                .department("Mathematics")
                .gpa(3.6)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        mockMvc.perform(post("/api/students")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void createStudent_withInvalidEmail_shouldReturnBadRequest() throws Exception {
        StudentRequest invalidReq = StudentRequest.builder()
                .name("Bob")
                .email("not-an-email")
                .phone("1234567890")
                .department("Mathematics")
                .gpa(3.6)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        mockMvc.perform(post("/api/students")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.validationErrors.email").exists());
    }

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void deleteStudent_asAdmin_shouldReturnNoContent() throws Exception {
        doNothing().when(studentService).deleteStudent(1L);

        mockMvc.perform(delete("/api/students/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(studentService, times(1)).deleteStudent(1L);
    }

    @Test
    @WithMockUser(authorities = "ROLE_FACULTY")
    void deleteStudent_asFaculty_shouldReturnForbidden() throws Exception {
        mockMvc.perform(delete("/api/students/1")
                        .with(csrf()))
                .andExpect(status().isForbidden());

        verify(studentService, never()).deleteStudent(anyLong());
    }
}
