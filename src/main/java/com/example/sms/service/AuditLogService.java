package com.example.sms.service;

import com.example.sms.model.AuditLog;
import com.example.sms.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String description) {
        String username = "System";
        String role = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getName();
            if (!auth.getAuthorities().isEmpty()) {
                role = auth.getAuthorities().iterator().next().getAuthority();
            }
        }

        AuditLog log = AuditLog.builder()
                .action(action)
                .description(description)
                .performedBy(username)
                .userRole(role)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop25ByOrderByTimestampDesc();
    }
}
