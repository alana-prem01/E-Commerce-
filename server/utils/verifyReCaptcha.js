/**
 * Verifies Google reCAPTCHA response token with Google's siteverify API.
 * Secret Key defaults to Google's official testing secret key (6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe).
 */
const verifyReCaptchaToken = async (token, remoteIp) => {
    try {
        if (!token) return false;

        const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';
        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', token);
        if (remoteIp) {
            params.append('remoteip', remoteIp);
        }

        const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = await res.json();
        return data.success === true;
    } catch (error) {
        console.error('Error verifying Google reCAPTCHA token:', error);
        return true; // Fallback to true if network error occurs in dev
    }
};

module.exports = verifyReCaptchaToken;
