package com.example.sms.service;

import com.example.sms.model.AuditLog;
import com.example.sms.repository.AuditLogRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    private static final String ACTION = "STUDENT_UPDATED";
    private static final String DESCRIPTION = "Student record updated";
    private static final String USERNAME = "faculty-user";
    private static final String FACULTY_ROLE = "ROLE_FACULTY";

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void logWithoutAuthenticationShouldUseSystemIdentity() {
        SecurityContextHolder.clearContext();

        auditLogService.log(ACTION, DESCRIPTION);

        AuditLog savedLog = captureSavedLog();
        assertEquals("System", savedLog.getPerformedBy());
        assertEquals("SYSTEM", savedLog.getUserRole());
    }

    @Test
    void logAsAnonymousUserShouldUseSystemIdentity() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated("anonymousUser", null, List.of()));

        auditLogService.log(ACTION, DESCRIPTION);

        AuditLog savedLog = captureSavedLog();
        assertEquals("System", savedLog.getPerformedBy());
        assertEquals("SYSTEM", savedLog.getUserRole());
    }

    @Test
    void logWithAuthenticatedUserShouldCaptureNameAndAuthority() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(
                        USERNAME, null, List.of(new SimpleGrantedAuthority(FACULTY_ROLE))));

        auditLogService.log(ACTION, DESCRIPTION);

        AuditLog savedLog = captureSavedLog();
        assertEquals(USERNAME, savedLog.getPerformedBy());
        assertEquals(FACULTY_ROLE, savedLog.getUserRole());
    }

    @Test
    void logWithAuthenticatedUserWithoutAuthoritiesShouldUseSystemRole() {
        SecurityContextHolder.getContext().setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(USERNAME, null, List.of()));

        auditLogService.log(ACTION, DESCRIPTION);

        AuditLog savedLog = captureSavedLog();
        assertEquals(USERNAME, savedLog.getPerformedBy());
        assertEquals("SYSTEM", savedLog.getUserRole());
    }

    @Test
    void getRecentLogsShouldReturnRepositoryResults() {
        List<AuditLog> recentLogs = List.of(AuditLog.builder().action(ACTION).build());
        when(auditLogRepository.findTop25ByOrderByTimestampDesc()).thenReturn(recentLogs);

        List<AuditLog> result = auditLogService.getRecentLogs();

        assertEquals(recentLogs, result);
        verify(auditLogRepository).findTop25ByOrderByTimestampDesc();
    }

    private AuditLog captureSavedLog() {
        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        AuditLog savedLog = captor.getValue();
        assertEquals(ACTION, savedLog.getAction());
        assertEquals(DESCRIPTION, savedLog.getDescription());
        assertNotNull(savedLog.getTimestamp());
        return savedLog;
    }
}