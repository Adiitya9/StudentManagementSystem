package com.example.sms.dto;

import com.example.sms.model.Student;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;

    public static StudentResponse fromEntity(Student student) {
        if (student == null) {
            return null;
        }
        return StudentResponse.builder()
                .id(student.getId())
                .name(student.getName())
                .email(student.getEmail())
                .phone(student.getPhone())
                .build();
    }
}
