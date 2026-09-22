package com.example.sms.dto;

import com.example.sms.model.Student;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String department;
    private Double gpa;
    private String status;
    private LocalDate enrollmentDate;

    public static StudentResponse fromEntity(Student student) {
        if (student == null) {
            return null;
        }
        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .department(student.getDepartment())
                .gpa(student.getGpa())
                .status(student.getStatus())
                .enrollmentDate(student.getEnrollmentDate())
                .build();
    }
}
