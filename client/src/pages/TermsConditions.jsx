import React from 'react';
import '../css/PrivacyPolicy.css';

function TermsConditions() {
  return (
    <section className="privacy-policy-section">
      <div className="privacy-policy-container">
        <h1 className="privacy-policy-title">Terms & Conditions</h1>

        <p className="privacy-policy-updated">
          Last Updated: <span className="privacy-policy-bold">August 15, 2026</span>
        </p>

        <h2 className="privacy-policy-heading">1. Introduction</h2>
        <p className="privacy-policy-text">
          Welcome to Elora Fine Jewellery. By accessing or using our website, services, and purchasing products from us, you agree to be bound by the following Terms and Conditions. Please read them carefully before making any transaction.
        </p>

        <h2 className="privacy-policy-heading">2. Eligibility & Account Security</h2>
        <p className="privacy-policy-text">
          You must be at least 18 years of age or accessing the site under the supervision of a parent or guardian. You are responsible for maintaining the confidentiality of your account credentials and for restricting access to your computer or mobile device.
        </p>

        <h2 className="privacy-policy-heading">3. Product Details & Pricing</h2>
        <p className="privacy-policy-text">
          We strive to present product images, specifications, and prices as accurately as possible. However, actual colours and details may slightly vary due to screen display settings. All prices are listed in Indian Rupees (INR) and are inclusive or exclusive of taxes as specified at checkout.
        </p>

        <h2 className="privacy-policy-heading">4. Orders & Payment</h2>
        <p className="privacy-policy-text">
          We reserve the right to refuse or cancel any order for reasons including availability of stock, errors in pricing or product information, or suspected fraudulent activity. Payments are processed securely via verified payment gateways (Razorpay / UPI / NetBanking / Cards).
        </p>

        <h2 className="privacy-policy-heading">5. Intellectual Property</h2>
        <p className="privacy-policy-text">
          All content included on this website, including designs, text, graphics, logos, images, and software, is the property of Elora Fine Jewellery and is protected by copyright and intellectual property laws.
        </p>

        <h2 className="privacy-policy-heading">6. Governing Law</h2>
        <p className="privacy-policy-text">
          These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in relation to these terms shall be subject to the exclusive jurisdiction of the courts in Kerala, India.
        </p>
      </div>
    </section>
  );
}

export default TermsConditions;
