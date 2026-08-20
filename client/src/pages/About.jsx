import React from "react";
import "../css/About.css";

function About() {
  // Star Icon Helper Component
  const RenderStars = ({ rating, size = 16 }) => {
    return (
      <div className="stars-container">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={star <= rating ? "#D4AF37" : "var(--border-color)"}
            stroke={star <= rating ? "#D4AF37" : "var(--border-color)"}
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  // Sample Customer Reviews Data
  const reviews = [
    {
      id: 1,
      rating: 5,
      text: "The craftsmanship of the necklace I bought is absolutely world-class! The diamonds shimmer brilliantly under any light, and the service was beyond expectation.",
      name: "Ananya Sharma",
    },
    {
      id: 2,
      rating: 5,
      text: "Bought gold bangles for my wedding anniversary. The purity and delicate work are truly magnificent. Highly recommended for authentic fine jewellery lovers!",
      name: "Meera Nair",
    },
    {
      id: 3,
      rating: 4,
      text: "Exquisite design and top-notch quality. Customer support helped me pick the right ring size smoothly. Delivery was quick and very securely packaged.",
      name: "Priya Sundaram",
    },
  ];

  return (
    <div className="about-page-container">
      {/* 1. Hero Section */}
      <section className="about-hero-section">
        {/* Dark Gradient Overlay */}
        <div className="about-hero-overlay" />

        {/* Content Wrapper */}
        <div className="about-hero-content">
          <h1 className="about-hero-heading">About Us</h1>
        </div>
      </section>

      {/* 2. Intro Statement Section */}
      <section className="about-intro-section">
        <div className="about-intro-container">
          <p className="about-quote">
            "Jewellery is not merely an ornament; it is a sacred archive of memories, a celebration of heritage, and a timeless pledge of love."
          </p>
        </div>
      </section>

      {/* 3. Brand Story Section */}
      <section className="about-story-section">
        <div className="about-story-container">
          <p className="about-story-paragraph">
            Established with a deep commitment to purity and perfection, our journey began as a humble atelier dedicated to handcrafting exquisite fine jewellery. Over the decades, we have preserved traditional Indian goldsmithing techniques while seamlessly infusing modern aesthetics into every single piece.
          </p>
          <p className="about-story-paragraph">
            Each gemstone is ethically sourced, every diamond meticulously set, and every curve of gold hallmarked for authenticity. We believe that fine jewellery should be both an everyday luxury and a cherished family heirloom passed down through generations.
          </p>
          <p className="about-story-paragraph">
            Today, we serve thousands of discerning patrons worldwide, staying true to our core ethos: uncompromised quality, transparent craftsmanship, and an enduring legacy of elegance.
          </p>
        </div>
      </section>

      {/* 4. Customer Review Section */}
      <section className="about-review-section">
        <div className="review-wrapper">
          {/* Section Heading */}
          <h2 className="about-review-heading">Loved by Our Patrons</h2>

          {/* Rating Summary Bar */}
          <div className="rating-summary-bar">
            <span className="rating-score">4.9</span>
            <RenderStars rating={5} size={20} />
            <span className="rating-count">(128 reviews)</span>
          </div>

          {/* Review Grid */}
          <div className="review-grid">
            {reviews.map((rev) => (
              <div key={rev.id} className="review-card">
                {/* Star Rating inside Card */}
                <div className="review-card-stars">
                  <RenderStars rating={rev.rating} size={16} />
                </div>

                {/* Review Text */}
                <p className="review-text-clamp">{rev.text}</p>

                {/* Reviewer Name */}
                <span className="reviewer-name">{rev.name}</span>
              </div>
            ))}
          </div>

          {/* View All Reviews Link */}
          <div className="view-all-reviews-wrapper">
            <a href="#reviews" className="view-all-reviews">
              View All Reviews
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;