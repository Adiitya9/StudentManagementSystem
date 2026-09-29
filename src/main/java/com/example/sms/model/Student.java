package com.example.sms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "students", indexes = {
    @Index(name = "idx_students_email", columnList = "email", unique = true),
    @Index(name = "idx_students_dept_status", columnList = "department, status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 60)
    private String department;

    @Column(nullable = false)
    private Double gpa;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false)
    private LocalDate enrollmentDate;
}
