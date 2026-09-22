package com.example.sms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false)
    private String performedBy;

    @Column(nullable = false)
    private String userRole;

    @Column(nullable = false)
    private LocalDateTime timestamp;
}
