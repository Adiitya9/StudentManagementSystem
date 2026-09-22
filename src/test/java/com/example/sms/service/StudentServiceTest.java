package com.example.sms.service;

import com.example.sms.dto.StudentRequest;
import com.example.sms.dto.StudentResponse;
import com.example.sms.exception.ResourceNotFoundException;
import com.example.sms.model.Student;
import com.example.sms.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;

    @Test
    void getAllStudents_shouldReturnMappedList() {
        Student s1 = Student.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .phone("1234567890")
                .department("Computer Science")
                .gpa(3.8)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        Student s2 = Student.builder()
                .id(2L)
                .name("Bob")
                .email("bob@example.com")
                .phone("0987654321")
                .department("Mathematics")
                .gpa(3.5)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        when(studentRepository.findAll()).thenReturn(List.of(s1, s2));

        List<StudentResponse> result = studentService.getAllStudents();

        assertEquals(2, result.size());
        assertEquals("Alice", result.get(0).getName());
        assertEquals("Computer Science", result.get(0).getDepartment());
        assertEquals(3.8, result.get(0).getGpa());
        assertEquals("Bob", result.get(1).getName());
        verify(studentRepository, times(1)).findAll();
    }

    @Test
    void getStudentById_whenFound_shouldReturnStudent() {
        Student student = Student.builder()
                .id(1L)
                .name("Alice")
                .email("alice@example.com")
                .phone("1234567890")
                .department("Computer Science")
                .gpa(3.8)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2023, 9, 1))
                .build();

        when(studentRepository.findById(1L)).thenReturn(Optional.of(student));

        StudentResponse result = studentService.getStudentById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("Alice", result.getName());
        assertEquals("Computer Science", result.getDepartment());
        assertEquals(3.8, result.getGpa());
    }

    @Test
    void getStudentById_whenNotFound_shouldThrowResourceNotFoundException() {
        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> studentService.getStudentById(99L));
    }

    @Test
    void createStudent_shouldSaveAndReturnResponse() {
        StudentRequest request = StudentRequest.builder()
                .name("Charlie")
                .email("charlie@example.com")
                .phone("555-123-4567")
                .department("Data Science")
                .gpa(3.9)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2024, 1, 15))
                .build();

        Student savedStudent = Student.builder()
                .id(10L)
                .name("Charlie")
                .email("charlie@example.com")
                .phone("555-123-4567")
                .department("Data Science")
                .gpa(3.9)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2024, 1, 15))
                .build();

        when(studentRepository.save(any(Student.class))).thenReturn(savedStudent);

        StudentResponse response = studentService.createStudent(request);

        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("Charlie", response.getName());
        assertEquals("Data Science", response.getDepartment());
        assertEquals(3.9, response.getGpa());
        verify(studentRepository).save(any(Student.class));
    }

    @Test
    void updateStudent_whenFound_shouldUpdateAndReturn() {
        Student existing = Student.builder()
                .id(1L)
                .name("Old Name")
                .email("old@example.com")
                .phone("111")
                .department("Computer Science")
                .gpa(3.0)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2022, 9, 1))
                .build();

        StudentRequest updateReq = StudentRequest.builder()
                .name("New Name")
                .email("new@example.com")
                .phone("222")
                .department("Physics")
                .gpa(3.7)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2022, 9, 1))
                .build();

        Student updated = Student.builder()
                .id(1L)
                .name("New Name")
                .email("new@example.com")
                .phone("222")
                .department("Physics")
                .gpa(3.7)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2022, 9, 1))
                .build();

        when(studentRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(studentRepository.save(existing)).thenReturn(updated);

        StudentResponse result = studentService.updateStudent(1L, updateReq);

        assertEquals("New Name", result.getName());
        assertEquals("Physics", result.getDepartment());
        assertEquals(3.7, result.getGpa());
    }

    @Test
    void updateStudent_whenNotFound_shouldThrowResourceNotFoundException() {
        StudentRequest updateReq = StudentRequest.builder()
                .name("New Name")
                .email("new@example.com")
                .phone("222")
                .department("Physics")
                .gpa(3.7)
                .status("ACTIVE")
                .enrollmentDate(LocalDate.of(2022, 9, 1))
                .build();

        when(studentRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> studentService.updateStudent(99L, updateReq));
    }

    @Test
    void deleteStudent_whenExists_shouldDelete() {
        when(studentRepository.existsById(1L)).thenReturn(true);
        doNothing().when(studentRepository).deleteById(1L);

        studentService.deleteStudent(1L);

        verify(studentRepository, times(1)).deleteById(1L);
    }

    @Test
    void deleteStudent_whenNotFound_shouldThrowResourceNotFoundException() {
        when(studentRepository.existsById(99L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> studentService.deleteStudent(99L));
        verify(studentRepository, never()).deleteById(anyLong());
    }
}
