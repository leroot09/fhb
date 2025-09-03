// Main JavaScript for Fast House Buyers Website
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initForms();
    initFAQ();
    initModal();
    initScrollAnimations();
    initSmoothScroll();
    initAnalytics();
    initLiveChat();
    initCallbackWidget();
});

// Navigation functionality
function initNavigation() {
    const mobileToggle = document.getElementById('mobileToggle');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.querySelector('.navbar');
    
    // Mobile menu toggle
    if (mobileToggle) {
        // Fallback overlay container appended to body for robust rendering
        let overlay = document.getElementById('mobileNavOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'mobileNavOverlay';
            overlay.className = 'mobile-nav-overlay';
            // Clone links from navMenu if present; else pull from DOM
            const linkContainer = navMenu || document.querySelector('.nav-menu');
            if (linkContainer) {
                linkContainer.querySelectorAll('a').forEach(a => {
                    const clone = a.cloneNode(true);
                    overlay.appendChild(clone);
                });
            }
            document.body.appendChild(overlay);
        }

        mobileToggle.addEventListener('click', function() {
            const willOpen = !overlay.classList.contains('active');
            overlay.classList.toggle('active');
            if (navMenu) {
                navMenu.classList.toggle('active');
                if (willOpen) navMenu.style.display = 'flex'; else navMenu.style.display = '';
            }
            mobileToggle.classList.toggle('active');
            document.body.style.overflow = willOpen ? 'hidden' : '';
        });

        // Close overlay when clicking a link
        document.addEventListener('click', function(e) {
            if (e.target.closest('#mobileNavOverlay a')) {
                overlay.classList.remove('active');
                if (navMenu) {
                    navMenu.classList.remove('active');
                    navMenu.style.display = '';
                }
                mobileToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    });
    
    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }
        
        lastScroll = currentScroll;
    });
}

// Form handling with webhook integration
function initForms() {
    // Remove any existing event listeners and add new webhook handlers
    const forms = [
        { id: 'quickOfferForm', type: 'hero' },
        { id: 'heroForm', type: 'testimonials' },
        { id: 'detailedOfferForm', type: 'modal' },
        { id: 'bottomOfferForm', type: 'bottom' },
        { id: 'offerFormSticky', type: 'cash-offer' },
        { id: 'contactForm', type: 'contact' },
        { id: 'stopForeclosureForm', type: 'foreclosure-guide' },
        { id: 'howItWorksForm', type: 'how-it-works' }
    ];
    
    const handledForms = new Set();
    forms.forEach(({ id, type }) => {
        const form = document.getElementById(id);
        if (form) {
            // Clear any existing listeners by cloning the form
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            
            // Add new webhook handler to the fresh form
            newForm.addEventListener('submit', function(e) {
                e.preventDefault();
                // Allow per-form override via data-form-type
                const overrideType = this.getAttribute('data-form-type');
                const finalType = overrideType || type;
                console.log(`📝 Form ${id} submitted, using webhook handler as ${finalType}`);
                handleWebhookFormSubmit(this, finalType);
            });
            
            console.log(`✅ Webhook handler added to ${id}`);
            handledForms.add(newForm);
        }
    });

    // Generic fallback: attach to any other forms on the page
    const allForms = Array.from(document.querySelectorAll('form'));
    allForms.forEach(formEl => {
        if (handledForms.has(formEl)) return;
        // Skip test form if present in repo
        if (formEl.id === 'testForm') return;

        // Determine type heuristically from classes/ids or data attribute
        const type = formEl.getAttribute('data-form-type') || formEl.id ||
            (formEl.classList.contains('modal-form') ? 'modal' :
            formEl.classList.contains('contact-form') ? 'contact' :
            formEl.classList.contains('bottom-offer-form') ? 'bottom' :
            formEl.classList.contains('offer-form') ? 'hero' : 'website');

        // Clear any existing listeners by cloning
        const cloned = formEl.cloneNode(true);
        formEl.parentNode.replaceChild(cloned, formEl);

        cloned.addEventListener('submit', function(e) {
            e.preventDefault();
            const overrideType = this.getAttribute('data-form-type');
            const finalType = overrideType || (typeof type === 'string' ? type : 'website');
            console.log(`📝 Form ${cloned.id || '(no-id)'} submitted, using webhook handler as ${finalType}`);
            handleWebhookFormSubmit(this, finalType);
        });

        console.log(`✅ Webhook handler added to generic form ${cloned.id || '(no-id)'}`);
    });
    
    // Phone number formatting
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    phoneInputs.forEach(input => {
        input.addEventListener('input', formatPhoneNumber);
    });
    
    console.log('🔗 Webhook form handlers initialized');
}

// handleFormSubmit removed - using handleWebhookFormSubmit directly

// Enhanced form validation
function validateForm(form) {
    let isValid = true;
    const errors = [];
    
    // Clear previous errors
    form.querySelectorAll('.error-message').forEach(error => error.remove());
    form.querySelectorAll('.form-group').forEach(group => group.classList.remove('error'));
    
    // Validate required fields
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'This field is required');
            isValid = false;
        }
    });
    
    // Validate email
    const emailField = form.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.value)) {
            showFieldError(emailField, 'Please enter a valid email address');
            isValid = false;
        }
    }
    
    // Validate phone
    const phoneField = form.querySelector('input[type="tel"]');
    if (phoneField && phoneField.value) {
        const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/;
        if (!phoneRegex.test(phoneField.value)) {
            showFieldError(phoneField, 'Please enter a valid phone number');
            isValid = false;
        }
    }
    
    // Validate address (basic check)
    const addressField = form.querySelector('input[name="address"]');
    if (addressField && addressField.value) {
        if (addressField.value.length < 10) {
            showFieldError(addressField, 'Please enter a complete address');
            isValid = false;
        }
    }
    
    return isValid;
}

function showFieldError(field, message) {
    const formGroup = field.closest('.form-group');
    formGroup.classList.add('error');
    
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    formGroup.appendChild(errorElement);
}

// ==============================================
// SIMPLE WEBHOOK INTEGRATION
// ==============================================

// Webhook Configuration
const WEBHOOK_CONFIG = {
    url: 'https://n8n.byunes.xyz/webhook/ghl-leads'
};

// Simple webhook submission function
async function submitToWebhook(formData, formType = 'website') {
    console.log('🚀 Starting webhook submission...', formData);
    
    try {
        // Prepare clean data for webhook
        const webhookData = {
            // Basic contact info
            firstName: formData.firstName || formData.name?.split(' ')[0] || '',
            lastName: formData.lastName || formData.name?.split(' ').slice(1).join(' ') || '',
            name: formData.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim(),
            email: formData.email,
            phone: formData.phone || '',
            
            // Property info
            address: formData.address || '',
            beds: formData.beds || '',
            baths: formData.baths || '',
            condition: formData.condition || '',
            timeframe: formData.timeframe || '',
            propertyType: formData.propertyType || '',
            
            // Additional info
            message: formData.message || formData.subject || '',
            
            // Meta info
            formType: formType,
            source: 'Website Form',
            submittedAt: new Date().toISOString(),
            pageUrl: window.location.href,
            userAgent: navigator.userAgent
        };

        console.log('📤 Sending to webhook:', webhookData);

        // Send to n8n webhook
        const response = await fetch(WEBHOOK_CONFIG.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookData)
        });

        const responseData = await response.text();
        console.log('📥 Webhook Response Status:', response.status);
        console.log('📥 Webhook Response Data:', responseData);

        if (!response.ok) {
            throw new Error(`Webhook Error ${response.status}: ${responseData}`);
        }

        console.log('✅ Webhook submission successful!');
        return responseData;

    } catch (error) {
        console.error('❌ Webhook submission failed:', error);
        throw error;
    }
}

// Form data extraction function
function extractFormData(formElement) {
    const formData = new FormData(formElement);
    const data = {};
    
    // Convert FormData to regular object
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }

    // Handle common field variations
    const fieldMappings = {
        'first-name': 'firstName',
        'firstname': 'firstName', 
        'first_name': 'firstName',
        'last-name': 'lastName',
        'lastname': 'lastName',
        'last_name': 'lastName',
        'full-name': 'name',
        'fullname': 'name',
        'full_name': 'name',
        'property-address': 'address',
        'property_address': 'address',
        'propertyaddress': 'address',
        'bedrooms': 'beds',
        'bathrooms': 'baths',
        'property-condition': 'condition',
        'property_condition': 'condition',
        'when-to-sell': 'timeframe',
        'selling-timeframe': 'timeframe',
        'timeline': 'timeframe'
    };

    // Apply field mappings
    Object.keys(fieldMappings).forEach(oldKey => {
        if (data[oldKey]) {
            data[fieldMappings[oldKey]] = data[oldKey];
        }
    });

    // Combine first and last name if needed
    if (!data.name && (data.firstName || data.lastName)) {
        data.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    }

    // Split name into first/last if needed
    if (data.name && !data.firstName && !data.lastName) {
        const nameParts = data.name.split(' ');
        data.firstName = nameParts[0] || '';
        data.lastName = nameParts.slice(1).join(' ') || '';
    }

    console.log('🔄 Mapped form data:', data);
    return data;
}

// Success and Error message functions
function showSuccessMessage(formElement) {
    // Remove any existing messages
    removeFormMessages(formElement);

    // Turn form container white and hide the form contents
    const formContainer = formElement.closest('.form-card, .form-card-contact, .sticky-form-container, form');
    if (formContainer) {
        formContainer.style.background = '#ffffff';
        formContainer.style.transition = 'background 240ms ease, border-color 240ms ease';
        formContainer.style.border = '1px solid #eee';
        formContainer.style.boxShadow = '0 6px 24px rgba(0,0,0,0.08)';
    }

    // Hide the form fields
    Array.from(formElement.children).forEach(child => {
        child.style.display = 'none';
    });

    // Build success UI
    const successWrap = document.createElement('div');
    successWrap.className = 'form-message success-message success-state';
    successWrap.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 12px;
        padding: 28px 18px;
        color: #111827;
    `;

    // Red check icon (SVG)
    const checkIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    checkIcon.setAttribute('width', '56');
    checkIcon.setAttribute('height', '56');
    checkIcon.setAttribute('viewBox', '0 0 24 24');
    checkIcon.setAttribute('fill', 'none');
    checkIcon.setAttribute('stroke', '#dc2626');
    checkIcon.setAttribute('stroke-width', '2');
    checkIcon.setAttribute('stroke-linecap', 'round');
    checkIcon.setAttribute('stroke-linejoin', 'round');
    checkIcon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>';

    const title = document.createElement('div');
    title.style.fontSize = '18px';
    title.style.fontWeight = '700';
    title.textContent = 'We received your submission!';

    const subtitle = document.createElement('div');
    subtitle.style.fontSize = '14px';
    subtitle.style.color = '#6b7280';
    subtitle.textContent = 'Thanks! We will contact you shortly.';

    successWrap.appendChild(checkIcon);
    successWrap.appendChild(title);
    successWrap.appendChild(subtitle);

    // Insert success UI inside the form container
    formElement.appendChild(successWrap);
}

function showErrorMessage(formElement, errorMsg = 'There was an error submitting your information. Please try again.') {
    // Remove any existing messages
    removeFormMessages(formElement);
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-message error-message';
    errorDiv.style.cssText = `
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 15px;
        border-radius: 5px;
        margin-top: 15px;
        font-size: 14px;
    `;
    errorDiv.innerHTML = `❌ ${errorMsg}`;
    
    // Insert after form
    formElement.parentNode.insertBefore(errorDiv, formElement.nextSibling);
    
    // Auto-hide after 8 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 8000);
}

function removeFormMessages(formElement) {
    const messages = formElement.parentNode.querySelectorAll('.form-message');
    messages.forEach(msg => msg.remove());
}

// Updated form handler using webhook integration
async function handleWebhookFormSubmit(formElement, formType = 'contact') {
    const submitButton = formElement.querySelector('button[type="submit"], input[type="submit"], .submit-btn');
    const originalText = submitButton ? submitButton.textContent || submitButton.value : '';
    
    try {
        // Show loading state
        if (submitButton) {
            submitButton.disabled = true;
            if (submitButton.textContent !== undefined) {
                submitButton.textContent = 'Submitting...';
            } else {
                submitButton.value = 'Submitting...';
            }
        }

        // Extract form data
        const formData = extractFormData(formElement);
        console.log('📝 Form data extracted:', formData);

        // Validate required fields via HTML required attributes
        if (!validateForm(formElement)) {
            throw new Error('Please complete required fields');
        }

        // Submit to webhook
        await submitToWebhook(formData, formType);

        // Show success message
        showSuccessMessage(formElement);
        
        // Reset form
        formElement.reset();

        // Track conversion
        if (typeof trackEvent === 'function') {
            trackEvent(`${formType}_form_submitted`, {
                form_type: formType,
                lead_source: 'website',
                location: 'Houston, TX'
            });
        }

    } catch (error) {
        console.error('Form submission error:', error);
        showErrorMessage(formElement, error.message);
    } finally {
        // Restore button state
        if (submitButton) {
            submitButton.disabled = false;
            if (submitButton.textContent !== undefined) {
                submitButton.textContent = originalText;
            } else {
                submitButton.value = originalText;
            }
        }
    }
}

// Fallback email service integration
async function sendViaEmailService(data) {
    // Example using EmailJS (replace with your service)
    const emailData = {
        to_email: 'alex@fasthousebuyers.net',
        from_name: `${data.firstName} ${data.lastName}`,
        from_email: data.email,
        phone: data.phone,
        address: data.address,
        property_type: data.propertyType || 'Not specified',
        condition: data.condition || 'Not specified',
        timeframe: data.timeframe || 'Not specified',
        message: `New lead from website: ${data.firstName} ${data.lastName} is interested in selling their property at ${data.address}.`
    };
    
    // This is a placeholder - replace with your actual email service
    console.log('Sending via email service:', emailData);
    return Promise.resolve({ success: true });
}

function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    
    if (value.length > 0) {
        if (value.length <= 3) {
            formattedValue = `(${value}`;
        } else if (value.length <= 6) {
            formattedValue = `(${value.slice(0, 3)}) ${value.slice(3)}`;
        } else {
            formattedValue = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
        }
    }
    
    e.target.value = formattedValue;
}

// New FAQ functionality
function initFAQ() {
    console.log('Initializing new FAQ...');
    const faqItems = document.querySelectorAll('.new-faq-item');
    console.log('Found new FAQ items:', faqItems.length);
    
    faqItems.forEach((item, index) => {
        const question = item.querySelector('.new-faq-question');
        if (question) {
            question.addEventListener('click', function() {
                console.log(`FAQ ${index + 1} clicked`);
                toggleNewFaq(item);
            });
        }
    });
}

function toggleNewFaq(faqItem) {
    const isActive = faqItem.classList.contains('active');
    
    // Close all FAQ items
    document.querySelectorAll('.new-faq-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Open clicked item if it wasn't active
    if (!isActive) {
        faqItem.classList.add('active');
        console.log('FAQ opened successfully');
    }
}

// Modal functionality
function initModal() {
    const modal = document.getElementById('offerModal');
    
    if (modal) {
        // Ensure a consistent modal form across all pages
        ensureStandardModal(modal);
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeOfferModal();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeOfferModal();
            }
        });
    }
}

// Build and inject a consistent modal form template if page uses an older layout
function ensureStandardModal(modalRoot) {
    const content = modalRoot.querySelector('.modal-content');
    if (!content) return;

    // If a standardized card already exists, keep it
    if (content.querySelector('.form-card')) return;

    const pageSlug = (location.pathname.split('/').pop() || 'index.html').replace('.html','') || 'home';
    const formType = `modal-${pageSlug}`;

    // Preserve close button if present
    const closeBtn = content.querySelector('.modal-close')?.outerHTML || '<button class="modal-close" onclick="closeOfferModal()"><i data-lucide="x"></i></button>';

    const template = `
        ${closeBtn}
        <div class="form-card modal-form-card">
            <div class="form-callout">
                <span class="callout-arrow">→</span>
                <span>Get Your Cash Offer</span>
            </div>
            <div class="form-header">
                <h3>Fast, Fair Cash Offer</h3>
                <p>Complete this quick form to receive your no‑obligation cash offer within 24 hours.</p>
            </div>
            <form id="detailedOfferForm" class="offer-form" data-form-type="${formType}">
                <div class="form-group">
                    <label for="modal-address">Property Address*</label>
                    <input type="text" id="modal-address" name="address" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="property-type">Property Type*</label>
                        <select id="property-type" name="propertyType" required>
                            <option value="">Select Type</option>
                            <option value="single-family">Single Family</option>
                            <option value="condo">Condo</option>
                            <option value="townhouse">Townhouse</option>
                            <option value="multi-family">Multi-Family</option>
                            <option value="mobile">Mobile Home</option>
                            <option value="land">Land</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="bedrooms">Bedrooms</label>
                        <select id="bedrooms" name="bedrooms">
                            <option value="">Select</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5+">5+</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="condition">Property Condition</label>
                    <select id="condition" name="condition">
                        <option value="">Select Condition</option>
                        <option value="excellent">Excellent - Move-in Ready</option>
                        <option value="good">Good - Minor Repairs Needed</option>
                        <option value="fair">Fair - Some Repairs Needed</option>
                        <option value="poor">Poor - Major Repairs Needed</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-first-name">First Name*</label>
                        <input type="text" id="modal-first-name" name="firstName" required>
                    </div>
                    <div class="form-group">
                        <label for="modal-last-name">Last Name*</label>
                        <input type="text" id="modal-last-name" name="lastName" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="modal-phone">Phone Number*</label>
                        <input type="tel" id="modal-phone" name="phone" required>
                    </div>
                    <div class="form-group">
                        <label for="modal-email">Email Address*</label>
                        <input type="email" id="modal-email" name="email" required>
                    </div>
                </div>
                <div class="form-group">
                    <label for="timeframe">When do you need to sell?</label>
                    <select id="timeframe" name="timeframe">
                        <option value="">Select Timeframe</option>
                        <option value="asap">ASAP</option>
                        <option value="30days">Within 30 days</option>
                        <option value="60days">Within 60 days</option>
                        <option value="90days">Within 90 days</option>
                        <option value="flexible">I'm flexible</option>
                    </select>
                </div>
                <div class="form-consent">
                    <label class="checkbox-label">
                        <input type="checkbox" name="smsConsent" required>
                        <span class="checkmark"></span>
                        <span class="consent-text">By checking this box, you agree to receive text messages from Fast House Buyers regarding your property inquiry and related services. Message frequency varies. Message and data rates may apply. Reply STOP to unsubscribe. View our <a href="/contact.html" class="text-link">Terms & Conditions</a> and <a href="/privacy-policy.html" class="text-link">Privacy Policy</a>.</span>
                    </label>
                </div>
                <button type="submit" class="btn btn-primary btn-block">
                    Get My Cash Offer
                    <i data-lucide="arrow-right"></i>
                </button>
                <p class="form-disclaimer">
                    <i data-lucide="lock"></i>
                    Your information is secure and will never be shared
                </p>
            </form>
        </div>`;

    content.innerHTML = template;

    // Attach webhook handler to the freshly built modal form immediately
    const builtForm = content.querySelector('#detailedOfferForm');
    if (builtForm) {
        builtForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log(`📝 Modal form submitted, using webhook handler as ${formType}`);
            handleWebhookFormSubmit(this, formType);
        });
        // Phone formatting for modal
        const phoneInputs = builtForm.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => input.addEventListener('input', formatPhoneNumber));
        console.log('✅ Modal form wired to webhook');
    }
}

function openOfferModal() {
    const modal = document.getElementById('offerModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function closeOfferModal() {
    const modal = document.getElementById('offerModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                
                // Animate children with stagger
                if (entry.target.classList.contains('stagger-children')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('active');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);
    
    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');
    animatedElements.forEach(el => observer.observe(el));
    
    // Add reveal classes to sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.add('reveal');
        observer.observe(section);
    });
}

// Smooth scroll
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = 80; // Navbar height
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Utility function to scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 80; // Navbar height
        const targetPosition = section.getBoundingClientRect().top + window.pageYOffset - offset;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Add styles
    const styles = `
        <style>
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                max-width: 400px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                z-index: 3000;
                animation: slideInRight 0.3s ease;
                border-left: 4px solid;
            }
            .notification-success { border-left-color: #10b981; }
            .notification-error { border-left-color: #ef4444; }
            .notification-info { border-left-color: #3b82f6; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
            }
            .notification-icon {
                font-size: 20px;
            }
            .notification-message {
                flex: 1;
                font-size: 14px;
                color: #374151;
            }
            .notification-close {
                background: none;
                border: none;
                font-size: 24px;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .notification-close:hover {
                color: #374151;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        </style>
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'notification-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement.firstElementChild);
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return '✅';
        case 'error': return '❌';
        case 'info': return 'ℹ️';
        default: return '📢';
    }
}

// Analytics initialization
function initAnalytics() {
    // Google Analytics 4 (replace GA_MEASUREMENT_ID with your actual ID)
    const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';
    
    // Load Google Analytics
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script1);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
        custom_map: {
            'custom_parameter_1': 'location',
            'custom_parameter_2': 'lead_source'
        }
    });
    
    // Track page view
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href,
        location: 'Phoenix, AZ'
    });
    
    // Track scroll depth
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll && scrollPercent % 25 === 0) {
            maxScroll = scrollPercent;
            trackEvent('scroll', {
                scroll_depth: scrollPercent
            });
        }
    });
}

// Enhanced analytics tracking
function trackEvent(eventName, eventData = {}) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, {
            event_category: 'engagement',
            event_label: eventData.form_type || 'general',
            location: 'Phoenix, AZ',
            ...eventData
        });
    }
    
    // Facebook Pixel (if you have one)
    if (typeof fbq !== 'undefined') {
        fbq('track', eventName, eventData);
    }
    
    // Console log for debugging
    console.log('Analytics Event:', eventName, eventData);
}

// Floating Call Button
function initLiveChat() {
    // Create floating call icon button (opens callback modal)
    const callWidget = document.createElement('div');
    callWidget.id = 'floating-call-widget';
    callWidget.innerHTML = `
        <button type="button" class="call-icon-btn" aria-label="Request a call back">
            <i data-lucide="phone"></i>
        </button>
    `;
    
    // Add styles
    const callStyles = document.createElement('style');
    callStyles.textContent = `
        #floating-call-widget { position: fixed; bottom: 40px; right: 32px; z-index: 1200; }
        .call-icon-btn {
            width: 68px; height: 68px; border-radius: 50%; border: none; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            background: var(--primary); color: #fff; box-shadow: var(--shadow-lg);
            transition: transform .2s ease, box-shadow .2s ease; animation: callPulse 3s infinite;
        }
        .call-icon-btn:hover { transform: translateY(-3px); box-shadow: var(--shadow-xl); }
        .call-icon-btn i { width: 28px; height: 28px; }
        @keyframes callPulse { 0%,100%{ transform: scale(1);} 50%{ transform: scale(1.05);} }
    `;
    document.head.appendChild(callStyles);
    document.body.appendChild(callWidget);

    // Wire click to open callback modal
    const btn = callWidget.querySelector('.call-icon-btn');
    btn.addEventListener('click', openCallbackModal);

    // Init icons
    setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
}

// Build callback popup and wire to webhook
function initCallbackWidget() {
    if (document.getElementById('callbackModal')) return;
    const modal = document.createElement('div');
    modal.id = 'callbackModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="form-card modal-form-card">
                <div class="form-callout"><span class="callout-arrow">→</span><span>Request a Call Back</span></div>
                <div class="form-header">
                    <h3>We can call you within 30 minutes</h3>
                    <p>Share your phone number and we’ll contact you shortly.</p>
                </div>
                <form id="callbackForm" class="offer-form" data-form-type="callback-widget">
                    <div class="form-group">
                        <label for="cb-phone">Phone Number*</label>
                        <input type="tel" id="cb-phone" name="phone" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Request a Call</button>
                </form>
            </div>
        </div>`;
    document.body.appendChild(modal);

    // Close when clicking outside
    modal.addEventListener('click', (e) => { if (e.target === modal) closeCallbackModal(); });

    // Attach submission to webhook
    const form = modal.querySelector('#callbackForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            handleWebhookFormSubmit(this, 'callback-widget');
        });
        const phone = form.querySelector('input[type="tel"]');
        if (phone) phone.addEventListener('input', formatPhoneNumber);
    }
}

function openCallbackModal() {
    const modal = document.getElementById('callbackModal');
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const inp = modal.querySelector('input'); if (inp) inp.focus(); }, 100);
}

function closeCallbackModal() {
    const modal = document.getElementById('callbackModal');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Track call button clicks
function trackCallClick() {
    // Track call interaction
    trackEvent('call_button_clicked', {
        interaction_type: 'call',
        location: 'Houston, TX',
        phone_number: '(832) 602-2021'
    });
}

// Add CSS for mobile menu
const mobileMenuStyles = `
<style>
    @media (max-width: 768px) {
        .nav-menu {
            position: fixed;
            top: 60px;
            left: 0;
            right: 0;
            background: var(--primary);
            flex-direction: column;
            padding: 1rem;
            border-bottom: 1px solid var(--primary-dark);
            transform: translateY(-100%);
            opacity: 0;
            transition: transform 0.3s ease, opacity 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .nav-menu.active {
            display: flex;
            transform: translateY(0);
            opacity: 1;
        }
        
        .mobile-toggle.active span:nth-child(1) {
            transform: rotate(45deg) translate(5px, 5px);
        }
        
        .mobile-toggle.active span:nth-child(2) {
            opacity: 0;
        }
        
        .mobile-toggle.active span:nth-child(3) {
            transform: rotate(-45deg) translate(5px, -5px);
        }
    }
    
    .navbar.scrolled {
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    .navbar.hidden {
        transform: translateY(-100%);
    }
    
    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
</style>
`;

// Add mobile menu styles to document
document.head.insertAdjacentHTML('beforeend', mobileMenuStyles);