package com.example.sms.service;

import com.example.sms.model.Student;
import com.example.sms.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@Service
public class StudentService {

    @Autowired
    private StudentRepository studentRepository;

    public void setStudentRepository(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Optional<Student> getStudentById(Long id) {
        return studentRepository.findById(Objects.requireNonNull(id, "id must not be null"));
    }

    public Student saveStudent(Student student) {
        return studentRepository.save(Objects.requireNonNull(student, "student must not be null"));
    }

    public Student updateStudent(Long id, Student studentDetails) {
        Long studentId = Objects.requireNonNull(id, "id must not be null");
        Student details = Objects.requireNonNull(studentDetails, "studentDetails must not be null");

        return studentRepository.findById(studentId)
                .map(student -> {
                    student.setName(details.getName());
                    student.setEmail(details.getEmail());
                    student.setPhone(details.getPhone());
                    return studentRepository.save(student);
                })
                .orElseThrow(() -> new RuntimeException("Student not found with id: " + studentId));
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(Objects.requireNonNull(id, "id must not be null"));
    }
}
