import { subscribeToNewsletter } from '../services/emailService';

class NewsletterShadowComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.subStatus = null;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .newsletter-container {
          position: relative;
          min-height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #4e45e1 0%, #4139BF 100%);
          box-shadow: 0 20px 40px rgba(0, 119, 182, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          max-width: 1200px;
          margin: 0 auto;
          overflow: hidden;
          color: white;
          padding: 4rem 1rem;
        }
        
        .animated-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        
        .circle-1 {
          position: absolute;
          top: 33.333333%;
          left: 33.333333%;
          width: 16rem;
          height: 16rem;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 50%;
          filter: blur(3rem);
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .circle-2 {
          position: absolute;
          bottom: 33.333333%;
          right: 33.333333%;
          width: 20rem;
          height: 20rem;
          background: rgba(37, 99, 235, 0.2);
          border-radius: 50%;
          filter: blur(3rem);
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          animation-delay: 1s;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 48rem;
          width: 100%;
        }
        
        .title {
          font-size: 2.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
          animation: fadeInUp 0.8s ease-out;
        }
        
        .subtitle {
          font-size: 1.125rem;
          color: rgb(209, 213, 219);
          margin-bottom: 2rem;
          animation: fadeInUp 0.8s ease-out 0.2s both;
        }
        
        .status-message {
          margin-bottom: 1rem;
          padding: 1rem;
          border-radius: 0.5rem;
          text-align: center;
        }
        
        .status-success {
          background-color: rgb(220, 252, 231);
          color: rgb(21, 128, 61);
          border: 1px solid rgb(187, 247, 208);
        }
        
        .status-error {
          background-color: rgb(254, 226, 226);
          color: rgb(153, 27, 27);
          border: 1px solid rgb(252, 165, 165);
        }
        
        .form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          justify-content: center;
          max-width: 28rem;
          margin: 0 auto;
        }
        
        @media (min-width: 640px) {
          .form {
            flex-direction: row;
          }
          .title {
            font-size: 3rem;
          }
        }
        
        @media (min-width: 1024px) {
          .title {
            font-size: 3.75rem;
          }
          .subtitle {
            font-size: 1.25rem;
          }
        }
        
        .email-input {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          color: rgb(17, 24, 39);
          border: none;
          outline: none;
          transition: transform 0.3s ease;
        }
        
        .email-input:focus {
          box-shadow: 0 0 0 2px rgb(59, 130, 246);
        }
        
        .email-input:hover {
          transform: scale(1.05);
        }
        
        .submit-btn {
          position: relative;
          background: #4e45e1;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .submit-btn:hover {
          background: #4139BF;
          transform: scale(1.05);
        }
        
        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-bg {
          position: absolute;
          inset: 0;
          background: #4139BF;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        
        .submit-btn:hover .btn-bg {
          opacity: 1;
        }
        
        .btn-blur {
          position: absolute;
          inset: -0.25rem;
          background: #4e45e1;
          border-radius: 50%;
          filter: blur(1px);
          opacity: 0.3;
          transition: opacity 0.3s ease;
        }
        
        .submit-btn:hover .btn-blur {
          opacity: 0.5;
        }
        
        .btn-text {
          position: relative;
          z-index: 10;
        }
      </style>
      
      <div class="newsletter-container">
        <div class="animated-bg">
          <div class="circle-1"></div>
          <div class="circle-2"></div>
        </div>
        
        <div class="content">
          <h2 class="title">Stay Updated</h2>
          <p class="subtitle">Get the latest insights and tutorials delivered to your inbox.</p>
          
          <div id="status-container"></div>
          
          <form class="form" id="newsletter-form">
            <input
              type="email"
              placeholder="Enter your email"
              class="email-input"
              id="email-input"
              required
            />
            <button type="submit" class="submit-btn" id="submit-btn">
              <span class="btn-text">Subscribe</span>
              <div class="btn-bg"></div>
              <div class="btn-blur"></div>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('newsletter-form');
    const emailInput = this.shadowRoot.getElementById('email-input');
    const submitBtn = this.shadowRoot.getElementById('submit-btn');
    const statusContainer = this.shadowRoot.getElementById('status-container');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = emailInput.value.trim();
      if (!email) return;

      submitBtn.disabled = true;
      submitBtn.querySelector('.btn-text').textContent = 'Subscribing...';

      try {
        // Subscribe using PHP service
        const result = await subscribeToNewsletter({ email });
        
        if (result.success) {
          this.showStatus('success', '✅ Thank you for subscribing!');
          emailInput.value = '';
        } else {
          throw new Error(result.message || 'Subscription failed');
        }
      } catch (error) {
        this.showStatus('error', '❌ Subscription failed. Please try again.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = 'Subscribe';
      }
    });
  }

  showStatus(type, message) {
    const statusContainer = this.shadowRoot.getElementById('status-container');
    const statusClass = type === 'success' ? 'status-success' : 'status-error';
    
    statusContainer.innerHTML = `
      <div class="status-message ${statusClass}">
        ${message}
      </div>
    `;

    // Clear status after 5 seconds
    setTimeout(() => {
      statusContainer.innerHTML = '';
    }, 5000);
  }
}

// Register the custom element
customElements.define('newsletter-shadow', NewsletterShadowComponent);

export default NewsletterShadowComponent;