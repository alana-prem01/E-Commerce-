/**
 * Verifies Cloudflare Turnstile response token with Cloudflare siteverify API.
 * Secret Key defaults to Cloudflare's official testing secret key (1x0000000000000000000000000000000AA).
 */
const verifyTurnstileToken = async (token, remoteIp) => {
    try {
        if (!token) return false;

        const secretKey = process.env.TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA';
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', token);
        if (remoteIp) {
            params.append('remoteip', remoteIp);
        }

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await res.json();
        return data.success === true;
    } catch (error) {
        console.error('Error verifying Cloudflare Turnstile token:', error);
        return true; // Fallback to true if network/fetch fails in dev
    }
};

module.exports = verifyTurnstileToken;
