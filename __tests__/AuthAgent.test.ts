import { AuthAgent } from '../src/core/AuthAgent';

// Mock fetch
global.fetch = jest.fn();

const PHONE = '+15555550100';
// The wire identifier the agent builds from a phone string.
const PHONE_ID = { channel: 'phone', phone: PHONE };

/** Build a fake Response with a JSON body and 2xx status. */
function okJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => JSON.stringify(body),
    headers: { get: () => null },
  };
}

/** Build a fake error Response with a text code body and optional Retry-After. */
function errText(status: number, code: string, retryAfter?: string) {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => code,
    headers: { get: (h: string) => (h === 'Retry-After' ? retryAfter ?? null : null) },
  };
}

describe('AuthAgent', () => {
  let agent: AuthAgent;

  beforeEach(() => {
    jest.clearAllMocks();
    agent = new AuthAgent('test-api-key');
  });

  describe('signIn', () => {
    it('sends to /v1/auth/otp/send with the API key and identifier body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(
        okJson({ requestId: 'otp_abc', expiresAt: 123 })
      );

      const res = await agent.signIn('phone', PHONE);

      expect(res).toEqual({ ok: true, data: { requestId: 'otp_abc', expiresAt: 123 } });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.appsidekit.com/v1/auth/otp/send',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'API-Key': 'test-api-key' }),
          body: JSON.stringify({ identifier: PHONE_ID, inviteCode: undefined }),
        })
      );
    });

    it('surfaces a 429 as rate_limited with retryAfter from the header', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(errText(429, 'rate_limited', '42'));

      const res = await agent.signIn('phone', PHONE);

      expect(res).toEqual({
        ok: false,
        error: 'rate_limited',
        status: 429,
        retryAfter: 42,
      });
    });

    it('passes an invite code through', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(okJson({ requestId: 'r', expiresAt: 1 }));

      await agent.signIn('phone', PHONE, 'INVITE123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ identifier: PHONE_ID, inviteCode: 'INVITE123' }),
        })
      );
    });
  });

  describe('verifyOtp', () => {
    it('returns the session + user on success', async () => {
      const data = {
        sessionToken: 'tok_xyz',
        expiresAt: 999,
        user: { id: 'u_1', handle: null, createdAt: 100 },
        newUser: true,
      };
      (global.fetch as jest.Mock).mockResolvedValue(okJson(data));

      const res = await agent.verifyOtp({ requestId: 'otp_abc', channel: 'phone', identifier: PHONE, code: '123456' });

      expect(res).toEqual({ ok: true, data });
    });

    it('maps a 401 body to its error code', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(errText(401, 'invalid_code'));

      const res = await agent.verifyOtp({ requestId: 'otp_abc', channel: 'phone', identifier: PHONE, code: '000000' });

      expect(res).toEqual({ ok: false, error: 'invalid_code', status: 401, retryAfter: undefined });
    });
  });

  describe('setHandle', () => {
    it('sends a Bearer token and PUTs the handle', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(okJson({ handle: 'neo' }));

      const res = await agent.setHandle('tok_xyz', 'neo');

      expect(res).toEqual({ ok: true, data: { handle: 'neo' } });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.appsidekit.com/v1/auth/handle',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({ Authorization: 'Bearer tok_xyz' }),
          body: JSON.stringify({ handle: 'neo' }),
        })
      );
    });

    it('maps a 409 to handle_taken', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(errText(409, 'handle_taken'));

      const res = await agent.setHandle('tok_xyz', 'taken');

      expect(res).toEqual({ ok: false, error: 'handle_taken', status: 409, retryAfter: undefined });
    });
  });

  describe('logout', () => {
    it('POSTs with the Bearer token and no body', async () => {
      (global.fetch as jest.Mock).mockResolvedValue(okJson({}));

      await agent.logout('tok_xyz');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.appsidekit.com/v1/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ Authorization: 'Bearer tok_xyz' }),
          body: undefined,
        })
      );
    });
  });

  describe('network failures', () => {
    it('returns network_error when fetch throws', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('offline'));

      const res = await agent.signIn('phone', PHONE);

      expect(res).toEqual({ ok: false, error: 'network_error', status: 0 });
    });
  });
});
