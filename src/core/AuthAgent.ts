/**
 * AuthAgent - HTTP client for SideKit end-user auth (/v1/auth/*)
 *
 * Handles the phone -> OTP -> session flow plus handle/email/logout. Unlike
 * AnalyticsAgent (fire-and-forget), every call returns an AuthResult so the UI can
 * branch on success vs. the error code the API surfaces (e.g. 'invalid_code',
 * 'rate_limited', 'handle_taken').
 */

import { log, error } from '../utils/logger';
import type { AuthResult, AuthOtpResponse, AuthVerifyResponse } from '../types';

const API_BASE_URL = 'https://api.appsidekit.com';
const API_AUTH_BASE = `${API_BASE_URL}/v1/auth`;

/**
 * AuthAgent class
 */
export class AuthAgent {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /** POST /v1/auth/otp/send — send an OTP to a phone number. */
  otpSend(
    phone: string,
    inviteCode?: string
  ): Promise<AuthResult<AuthOtpResponse>> {
    const identifier = { channel: 'phone' as const, phone };
    return this.call('POST', '/otp/send', { identifier, inviteCode });
  }

  /** POST /v1/auth/otp/verify — verify the code and mint a session. */
  otpVerify(params: {
    requestId: string;
    phone: string;
    code: string;
  }): Promise<AuthResult<AuthVerifyResponse>> {
    const identifier = { channel: 'phone' as const, phone: params.phone };
    return this.call('POST', '/otp/verify', {
      requestId: params.requestId,
      identifier,
      code: params.code,
    });
  }

  /** PUT /v1/auth/handle — set the signed-in user's handle (Bearer). */
  setHandle(
    token: string,
    handle: string
  ): Promise<AuthResult<{ handle: string }>> {
    return this.call('PUT', '/handle', { handle }, token);
  }

  /** PUT /v1/auth/email — attach a recovery email (Bearer). */
  setEmail(
    token: string,
    email: string
  ): Promise<AuthResult<{ email: string }>> {
    return this.call('PUT', '/email', { email }, token);
  }

  /** POST /v1/auth/logout — revoke the session (Bearer). Idempotent. */
  logout(token: string): Promise<AuthResult<Record<string, never>>> {
    return this.call('POST', '/logout', undefined, token);
  }

  /**
   * Issue a request and map the response into an AuthResult. On 2xx the JSON body is
   * returned as `data`; otherwise the (short, text) error code the API returns becomes
   * `error`, with the HTTP status and any Retry-After (seconds) attached.
   */
  private async call<T>(
    method: string,
    path: string,
    body: unknown,
    token?: string
  ): Promise<AuthResult<T>> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'API-Key': this.apiKey,
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${API_AUTH_BASE}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      if (response.ok) {
        const data = (await response.json().catch(() => ({}))) as T;
        log(`Auth ${method} ${path} ok (${response.status})`);
        return { ok: true, data };
      }

      // Error responses carry a short text code as the body (e.g. 'invalid_code').
      const text = (await response.text().catch(() => '')).trim();
      const errorCode = text || `http_${response.status}`;
      const retryAfterHeader = response.headers.get('Retry-After');
      const retryAfter = retryAfterHeader
        ? Number(retryAfterHeader)
        : undefined;

      log(`Auth ${method} ${path} failed (${response.status}): ${errorCode}`);
      return {
        ok: false,
        error: errorCode,
        status: response.status,
        retryAfter,
      };
    } catch (err) {
      error(`Auth ${method} ${path} request failed`, err);
      return { ok: false, error: 'network_error', status: 0 };
    }
  }
}
