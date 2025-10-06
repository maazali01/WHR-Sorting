import React from 'react';
import './contact.css';
import { FaFacebookF, FaTwitter, FaInstagram } from 'react-icons/fa';

const Contact = () => (
  <div className="contact-card">
    <form className="contact-form" action="https://formspree.io/f/xpzgknry" method="POST">
      <h1 className="contact-title">Feedback Form</h1>
      <p className="contact-subtitle">
        We value your feedback! Fill out the form below or connect with us on social media.
      </p>

      <label htmlFor="name">Name</label>
      <input className="contact-input" type="text" name="name" id="name" placeholder="Your name" />

      <label htmlFor="email">Email</label>
      <input className="contact-input" type="email" name="email" id="email" placeholder="your-name@gmail.com" />

      <label htmlFor="message">Your Feedback</label>
      <textarea className="contact-textarea" name="message" id="message" placeholder="Write your feedback here..."></textarea>

      <button className="contact-submit" type="submit">Submit</button>
    </form>

    <div className="divider">or</div>

    <div className="social-icons">
      <p className="social-text">Connect with us</p>
      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
      <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
    </div>
  </div>
);

export default Contact;
