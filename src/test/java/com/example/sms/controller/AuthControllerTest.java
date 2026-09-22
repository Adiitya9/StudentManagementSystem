package com.example.sms.controller;

import com.example.sms.dto.LoginRequest;
import com.example.sms.model.Role;
import com.example.sms.model.User;
import com.example.sms.repository.UserRepository;
import com.example.sms.security.JwtAuthenticationFilter;
import com.example.sms.security.JwtTokenProvider;
import com.example.sms.security.SecurityConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private PasswordEncoder passwordEncoder;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void login_withValidCredentials_shouldReturnTokenAndUserInfo() throws Exception {
        User user = User.builder()
                .id(1L)
                .username("admin")
                .password("encoded_pass")
                .fullName("Dr. Eleanor Vance")
                .email("admin@studeo.edu")
                .role(Role.ROLE_ADMIN)
                .build();

        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("admin123")
                .build();

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("admin123", "encoded_pass")).thenReturn(true);
        when(jwtTokenProvider.generateToken("admin", Role.ROLE_ADMIN, "Dr. Eleanor Vance"))
                .thenReturn("mocked.jwt.token");

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.username").value("admin"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    @Test
    void login_withInvalidPassword_shouldReturnUnauthorized() throws Exception {
        User user = User.builder()
                .username("admin")
                .password("encoded_pass")
                .build();

        LoginRequest request = LoginRequest.builder()
                .username("admin")
                .password("wrongpassword")
                .build();

        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongpassword", "encoded_pass")).thenReturn(false);

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }
}
