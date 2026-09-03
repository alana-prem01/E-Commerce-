import React, { useState } from 'react';
import '../css/PrivacyPolicy.css';
import { FaChevronDown } from 'react-icons/fa';

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    {
      q: "How can I track my order?",
      a: "Once your order is shipped, you will receive an email and SMS notification containing your tracking details. You can also track your order directly on our website under the 'Order Tracking' page."
    },
    {
      q: "What is your return and exchange policy?",
      a: "Under normal circumstances, all sales are final. However, if your product arrives damaged or incorrect, you can request an exchange within 48 hours of delivery accompanied by an unedited unboxing video."
    },
    {
      q: "Are the jewellery items certified and authentic?",
      a: "Yes! All our jewellery pieces undergo strict quality inspection and certification to ensure authenticity, premium crafting, and lifetime quality assurance."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit/debit cards, UPI payments (Google Pay, PhonePe, Paytm), Net Banking, and wallet payments via our secure Razorpay gateway."
    },
    {
      q: "How long does standard delivery take?",
      a: "Standard shipping usually takes 3 to 7 business days depending on your location. Express shipping options deliver within 2 to 4 business days."
    },
    {
      q: "How do I care for my jewellery?",
      a: "Keep your jewellery away from water, perfumes, hairsprays, and harsh chemicals. Store each piece separately in an airtight box or soft pouch to maintain its shine."
    }
  ];

  return (
    <section className="privacy-policy-section">
      <div className="privacy-policy-container" style={{ maxWidth: '850px' }}>
        <h1 className="privacy-policy-title">Frequently Asked Questions (FAQ)</h1>
        <p className="privacy-policy-updated" style={{ textAlign: 'center', marginBottom: '40px' }}>
          Have questions? We're here to help! Find answers to common questions below.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIdx === index;
            return (
              <div 
                key={index} 
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : index)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#005e68',
                    fontFamily: 'var(--heading-font)'
                  }}
                >
                  <span>{faq.q}</span>
                  <FaChevronDown 
                    style={{ 
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s ease',
                      flexShrink: 0,
                      marginLeft: '16px',
                      color: '#005e68'
                    }} 
                  />
                </button>
                {isOpen && (
                  <div style={{ padding: '0 24px 20px 24px', color: '#45484c', fontSize: '15px', lineHeight: '1.7', borderTop: '1px solid #F3F4F6', paddingTop: '16px' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
