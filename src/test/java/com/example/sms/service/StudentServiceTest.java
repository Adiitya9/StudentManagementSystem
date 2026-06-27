package com.example.sms.service;

import com.example.sms.model.Student;
import com.example.sms.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class StudentServiceTest {

    private StudentService studentService;
    private StudentRepository studentRepository;

    @BeforeEach
    void setUp() {
        studentService = new StudentService();
        studentRepository = inMemoryStudentRepository();
        studentService.setStudentRepository(studentRepository);
    }

    @Test
    void shouldReturnStudentWhenFound() {
        Student student = new Student(null, "Alice", "alice@example.com", "1234567890");
        Student saved = studentRepository.save(student);

        Optional<Student> result = studentService.getStudentById(saved.getId());

        assertEquals("Alice", result.orElseThrow().getName());
    }

    @SuppressWarnings("unchecked")
    private StudentRepository inMemoryStudentRepository() {
        Map<Long, Student> students = new HashMap<>();
        long[] nextId = {1L};

        return (StudentRepository) Proxy.newProxyInstance(
                StudentRepository.class.getClassLoader(),
                new Class<?>[]{StudentRepository.class},
                (proxy, method, args) -> {
                    String methodName = method.getName();

                    if ("save".equals(methodName)) {
                        Student student = (Student) args[0];
                        if (student.getId() == null) {
                            student.setId(nextId[0]++);
                        }
                        students.put(student.getId(), student);
                        return student;
                    }

                    if ("findById".equals(methodName)) {
                        return Optional.ofNullable(students.get((Long) args[0]));
                    }

                    if ("findAll".equals(methodName)) {
                        return List.copyOf(students.values());
                    }

                    if ("deleteById".equals(methodName)) {
                        students.remove((Long) args[0]);
                        return null;
                    }

                    throw new UnsupportedOperationException("Unsupported repository method: " + methodName);
                });
    }
}
