package com.example.sms.security;

import com.example.sms.model.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtTokenProviderTest {

    private static final String SECRET = "test-secret-key-with-at-least-256-bits-of-entropy";

    @Test
    void generatedTokenShouldContainExpectedClaimsAndValidate() {
        JwtTokenProvider provider = new JwtTokenProvider(SECRET, 60_000);

        String token = provider.generateToken("student-user", Role.ROLE_STUDENT, "Student User");

        assertTrue(provider.validateToken(token));
        assertEquals("student-user", provider.getUsernameFromToken(token));
        assertEquals("ROLE_STUDENT", provider.getRoleFromToken(token));
        assertEquals("Student User", provider.getFullNameFromToken(token));
    }

    @Test
    void validateTokenShouldRejectMalformedToken() {
        JwtTokenProvider provider = new JwtTokenProvider(SECRET, 60_000);

        assertFalse(provider.validateToken("not-a-jwt"));
    }

    @Test
    void validateTokenShouldRejectExpiredToken() {
        // Use a negative expiration to create a token that is already well past the 60s clock skew tolerance
        JwtTokenProvider provider = new JwtTokenProvider(SECRET, -120_000);
        String token = provider.generateToken("student-user", Role.ROLE_STUDENT, "Student User");

        assertFalse(provider.validateToken(token));
    }

    @Test
    void validateTokenShouldRejectTokenSignedWithDifferentKey() {
        JwtTokenProvider issuer = new JwtTokenProvider(SECRET, 60_000);
        JwtTokenProvider verifier = new JwtTokenProvider(
                "different-test-key-with-at-least-256-bits-of-entropy", 60_000);
        String token = issuer.generateToken("student-user", Role.ROLE_STUDENT, "Student User");

        assertFalse(verifier.validateToken(token));
    }
}
