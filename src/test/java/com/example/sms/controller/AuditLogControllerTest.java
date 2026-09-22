package com.example.sms.controller;

import com.example.sms.model.AuditLog;
import com.example.sms.security.JwtAuthenticationFilter;
import com.example.sms.security.JwtTokenProvider;
import com.example.sms.security.SecurityConfig;
import com.example.sms.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditLogController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditLogService auditLogService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(authorities = "ROLE_ADMIN")
    void getRecentLogs_asAdmin_shouldReturnLogs() throws Exception {
        AuditLog log = AuditLog.builder()
                .id(1L)
                .action("STUDENT_CREATED")
                .performedBy("admin")
                .userRole("ROLE_ADMIN")
                .description("Created student Alice")
                .timestamp(LocalDateTime.now())
                .build();

        when(auditLogService.getRecentLogs()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].action").value("STUDENT_CREATED"))
                .andExpect(jsonPath("$[0].performedBy").value("admin"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_FACULTY")
    void getRecentLogs_asFaculty_shouldReturnLogs() throws Exception {
        AuditLog log = AuditLog.builder()
                .id(2L)
                .action("STUDENT_UPDATED")
                .performedBy("faculty")
                .userRole("ROLE_FACULTY")
                .description("Updated GPA to 3.9")
                .timestamp(LocalDateTime.now())
                .build();

        when(auditLogService.getRecentLogs()).thenReturn(List.of(log));

        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].action").value("STUDENT_UPDATED"));
    }

    @Test
    @WithMockUser(authorities = "ROLE_STUDENT")
    void getRecentLogs_asStudent_shouldReturnForbidden() throws Exception {
        mockMvc.perform(get("/api/audit-logs"))
                .andExpect(status().isForbidden());
    }
}
