import React from 'react';
import { Link } from 'react-router-dom';
import '../css/PrivacyPolicy.css';

function PrivacyPolicy() {
  return (
    <section className="privacy-policy-section">
      <div className="privacy-policy-container">
        {/* Page Title */}
        <h1 className="privacy-policy-title">Privacy Policy</h1>

        {/* Last Updated Date */}
        <p className="privacy-policy-updated">
          Last Updated: <span className="privacy-policy-bold">August 10, 2026</span>
        </p>

        {/* Introduction Section */}
        <h2 className="privacy-policy-heading">Privacy Policy</h2>
        <p className="privacy-policy-text">
          This Privacy Policy describes how we collect, use, and disclose your personal information when you visit, use our services, or make a purchase from our website. We respect your privacy and are committed to protecting your personal data in compliance with applicable data privacy regulations.
        </p>

        {/* Section: Personal Information We Collect */}
        <h2 className="privacy-policy-heading">Personal Information We Collect</h2>
        <p className="privacy-policy-text">
          Depending on how you interact with our services, we may collect various types of personal information:
        </p>
        <ul className="privacy-policy-list">
          <li className="privacy-policy-list-item">
            <span className="privacy-policy-bold">Contact Details:</span> Includes your name, billing address, shipping address, email address, and phone number.
          </li>
          <li className="privacy-policy-list-item">
            <span className="privacy-policy-bold">Financial Information:</span> Includes payment card numbers, payment processor identifiers, and transaction history.
          </li>
          <li className="privacy-policy-list-item">
            <span className="privacy-policy-bold">Account Information:</span> Username, password, order history, and saved preferences.
          </li>
        </ul>

        {/* Section: Personal Information Sources */}
        <h2 className="privacy-policy-heading">Personal Information Sources</h2>
        <p className="privacy-policy-text">
          We collect personal information directly from you when you fill out forms, create an account, or place an order. We may also collect data automatically through cookies or receive information from trusted third-party partners.
        </p>

        {/* Section: External Links / Contact */}
        <h2 className="privacy-policy-heading">External Links & Support</h2>
        <p className="privacy-policy-text">
          Our website may contain links to third-party websites. Please review our full terms at our{' '}
          <Link
            to="/terms-conditions"
            className="privacy-policy-link"
          >
            Terms of Service page
          </Link>
          . If you have any questions or privacy requests, feel free to contact us directly via our{' '}
          <Link
            to="/contact"
            className="privacy-policy-link"
          >
            Support Portal
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

export default PrivacyPolicy;