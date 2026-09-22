package com.example.sms.config;

import com.example.sms.model.AuditLog;
import com.example.sms.model.Role;
import com.example.sms.model.User;
import com.example.sms.repository.AuditLogRepository;
import com.example.sms.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class SecurityDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed default demo accounts
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("Dr. Eleanor Vance")
                    .email("admin@studeo.edu")
                    .role(Role.ROLE_ADMIN)
                    .build());

            userRepository.save(User.builder()
                    .username("faculty")
                    .password(passwordEncoder.encode("faculty123"))
                    .fullName("Prof. Marcus Thorne")
                    .email("faculty@studeo.edu")
                    .role(Role.ROLE_FACULTY)
                    .build());

            userRepository.save(User.builder()
                    .username("student")
                    .password(passwordEncoder.encode("student123"))
                    .fullName("Sarah Johnson")
                    .email("sarah.johnson@example.com")
                    .role(Role.ROLE_STUDENT)
                    .build());
        }

        // Seed initial activity feed entries
        if (auditLogRepository.count() == 0) {
            LocalDateTime now = LocalDateTime.now();

            auditLogRepository.save(AuditLog.builder()
                    .action("STUDENT_ENROLLED")
                    .description("Jessica Chen enrolled in Information Technology (GPA: 3.95)")
                    .performedBy("admin")
                    .userRole("ROLE_ADMIN")
                    .timestamp(now.minusHours(3))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .action("STUDENT_UPDATED")
                    .description("Sarah Johnson profile updated — GPA updated to 3.92")
                    .performedBy("faculty")
                    .userRole("ROLE_FACULTY")
                    .timestamp(now.minusMinutes(45))
                    .build());

            auditLogRepository.save(AuditLog.builder()
                    .action("STUDENT_UPDATED")
                    .description("Michael Brown profile updated — Status changed to PROBATION")
                    .performedBy("admin")
                    .userRole("ROLE_ADMIN")
                    .timestamp(now.minusMinutes(12))
                    .build());
        }
    }
}
