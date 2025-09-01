import React from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

const CaptchaWidget = ({ onChange }) => {
  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null; // allow local dev without captcha
  return (
    <div className="mt-2">
      <ReCAPTCHA sitekey={siteKey} onChange={onChange} />
    </div>
  );
};
export default CaptchaWidget;
