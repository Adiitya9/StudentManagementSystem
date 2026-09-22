package com.example.sms.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentRequest {

    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[+0-9() -]{7,20}$", message = "Phone number must be between 7 and 20 digits, optionally containing +, -, spaces, or parentheses")
    private String phone;

    @NotBlank(message = "Department is required")
    @Size(min = 2, max = 60, message = "Department must be between 2 and 60 characters")
    private String department;

    @NotNull(message = "GPA is required")
    @DecimalMin(value = "0.0", message = "GPA cannot be less than 0.0")
    @DecimalMax(value = "4.0", message = "GPA cannot exceed 4.0")
    private Double gpa;

    @NotBlank(message = "Status is required")
    @Pattern(regexp = "ACTIVE|PROBATION|GRADUATED|INACTIVE", message = "Status must be ACTIVE, PROBATION, GRADUATED, or INACTIVE")
    private String status;

    @NotNull(message = "Enrollment date is required")
    private LocalDate enrollmentDate;
}
