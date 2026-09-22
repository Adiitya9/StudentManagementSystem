package com.example.sms.service;

import com.example.sms.dto.StudentRequest;
import com.example.sms.dto.StudentResponse;
import com.example.sms.exception.ResourceNotFoundException;
import com.example.sms.model.Student;
import com.example.sms.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final AuditLogService auditLogService;

    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {
        return studentRepository.findAll()
                .stream()
                .map(StudentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        return studentRepository.findById(id)
                .map(StudentResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));
    }

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        Objects.requireNonNull(request, "request must not be null");
        Student student = Student.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone().trim())
                .department(request.getDepartment().trim())
                .gpa(request.getGpa())
                .status(request.getStatus().trim().toUpperCase())
                .enrollmentDate(request.getEnrollmentDate())
                .build();
        Student saved = studentRepository.save(student);

        auditLogService.log("STUDENT_ENROLLED",
                saved.getName() + " enrolled in " + saved.getDepartment() + " (GPA: " + String.format("%.2f", saved.getGpa()) + ")");

        return StudentResponse.fromEntity(saved);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(request, "request must not be null");

        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        Double oldGpa = student.getGpa();
        String oldStatus = student.getStatus();

        student.setName(request.getName().trim());
        student.setEmail(request.getEmail().trim());
        student.setPhone(request.getPhone().trim());
        student.setDepartment(request.getDepartment().trim());
        student.setGpa(request.getGpa());
        student.setStatus(request.getStatus().trim().toUpperCase());
        student.setEnrollmentDate(request.getEnrollmentDate());

        Student updated = studentRepository.save(student);

        String updateDetail = updated.getName() + " profile updated";
        if (!Objects.equals(oldGpa, updated.getGpa())) {
            updateDetail += " — GPA updated to " + String.format("%.2f", updated.getGpa());
        } else if (!Objects.equals(oldStatus, updated.getStatus())) {
            updateDetail += " — Status changed to " + updated.getStatus();
        }

        auditLogService.log("STUDENT_UPDATED", updateDetail);

        return StudentResponse.fromEntity(updated);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Objects.requireNonNull(id, "id must not be null");
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found with id: " + id));

        studentRepository.deleteById(id);

        auditLogService.log("STUDENT_DELETED",
                "Student record #" + id + " (" + student.getName() + ", " + student.getDepartment() + ") was deleted");
    }
}
