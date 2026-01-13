import React, { useState } from 'react';

function EnhancedTemplatesModal({ open, onClose, onInsert }) {
  if (!open) return null;
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);
  
  const templateCategories = {
    'hero': {
      name: 'Hero Sections',
      icon: '🚀',
      templates: [
        {
          name: 'Modern Hero',
          description: 'Clean hero section with gradient background',
          html: `<section class='py-20 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl flex flex-col items-center justify-center text-center'><h1 class='text-5xl font-bold mb-6 leading-tight'>Build Amazing Websites</h1><p class='text-xl mb-8 max-w-2xl opacity-90'>Create stunning, responsive websites with our powerful drag-and-drop builder. No coding required.</p><div class='flex flex-col sm:flex-row gap-4'><a href='#' class='bg-white text-blue-600 font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-50 transition transform hover:scale-105'>Get Started Free</a><a href='#' class='border-2 border-white text-white font-semibold px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition'>Watch Demo</a></div></section>`
        },
        {
          name: 'Minimal Hero',
          description: 'Simple and elegant hero section',
          html: `<section class='py-24 px-8 bg-white text-gray-900 rounded-2xl flex flex-col items-center justify-center text-center'><h1 class='text-4xl font-bold mb-6 text-gray-900'>Simple. Powerful. Beautiful.</h1><p class='text-lg mb-8 max-w-xl text-gray-600'>Everything you need to create professional websites that convert visitors into customers.</p><a href='#' class='bg-blue-600 text-white font-semibold px-8 py-4 rounded-lg shadow hover:bg-blue-700 transition'>Start Building</a></section>`
        },
        {
          name: 'Video Hero',
          description: 'Hero section with video background placeholder',
          html: `<section class='relative py-32 px-8 bg-gray-900 text-white rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden'><div class='absolute inset-0 bg-black/40 z-10'></div><div class='relative z-20'><h1 class='text-5xl font-bold mb-6'>Experience Innovation</h1><p class='text-xl mb-8 max-w-2xl'>Watch your ideas come to life with our cutting-edge platform.</p><a href='#' class='bg-white text-gray-900 font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-gray-100 transition'>Discover More</a></div></section>`
        }
      ]
    },
    'features': {
      name: 'Features',
      icon: '⭐',
      templates: [
        {
          name: 'Feature Grid',
          description: '3-column feature showcase',
          html: `<section class='py-16 px-8 bg-white text-gray-800 rounded-2xl'><div class='text-center mb-12'><h2 class='text-3xl font-bold mb-4'>Why Choose Us</h2><p class='text-lg text-gray-600 max-w-2xl mx-auto'>Discover the features that make our platform the best choice for your business.</p></div><div class='grid grid-cols-1 md:grid-cols-3 gap-8'><div class='text-center p-6'><div class='w-16 h-16 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4 mx-auto text-2xl'>🚀</div><h4 class='text-xl font-bold mb-3'>Lightning Fast</h4><p class='text-gray-600'>Optimized for speed and performance to keep your users engaged.</p></div><div class='text-center p-6'><div class='w-16 h-16 bg-green-100 text-green-600 flex items-center justify-center rounded-full mb-4 mx-auto text-2xl'>🔒</div><h4 class='text-xl font-bold mb-3'>Secure & Safe</h4><p class='text-gray-600'>Enterprise-grade security to protect your data and privacy.</p></div><div class='text-center p-6'><div class='w-16 h-16 bg-purple-100 text-purple-600 flex items-center justify-center rounded-full mb-4 mx-auto text-2xl'>💡</div><h4 class='text-xl font-bold mb-3'>Smart & Intuitive</h4><p class='text-gray-600'>Intelligent features that adapt to your workflow and needs.</p></div></div></section>`
        },
        {
          name: 'Feature Cards',
          description: 'Card-based feature layout',
          html: `<section class='py-16 px-8 bg-gray-50 rounded-2xl'><h2 class='text-3xl font-bold text-center mb-12 text-gray-900'>Powerful Features</h2><div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'><div class='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition'><div class='w-12 h-12 bg-blue-500 text-white flex items-center justify-center rounded-lg mb-4 text-xl'>📊</div><h4 class='text-xl font-bold mb-3 text-gray-900'>Analytics</h4><p class='text-gray-600'>Track your performance with detailed analytics and insights.</p></div><div class='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition'><div class='w-12 h-12 bg-green-500 text-white flex items-center justify-center rounded-lg mb-4 text-xl'>🎨</div><h4 class='text-xl font-bold mb-3 text-gray-900'>Customization</h4><p class='text-gray-600'>Customize every aspect to match your brand perfectly.</p></div><div class='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition'><div class='w-12 h-12 bg-purple-500 text-white flex items-center justify-center rounded-lg mb-4 text-xl'>⚡</div><h4 class='text-xl font-bold mb-3 text-gray-900'>Automation</h4><p class='text-gray-600'>Automate repetitive tasks and focus on what matters.</p></div></div></section>`
        }
      ]
    },
    'pricing': {
      name: 'Pricing',
      icon: '💰',
      templates: [
        {
          name: 'Simple Pricing',
          description: 'Clean 2-column pricing table',
          html: `<section class='py-16 px-8 bg-white rounded-2xl'><div class='text-center mb-12'><h2 class='text-3xl font-bold mb-4 text-gray-900'>Simple Pricing</h2><p class='text-lg text-gray-600'>Choose the plan that works best for you</p></div><div class='grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto'><div class='bg-white border-2 border-gray-200 rounded-2xl p-8 text-center'><h3 class='text-2xl font-bold mb-4 text-gray-900'>Starter</h3><div class='text-4xl font-bold mb-6 text-gray-900'>$19<span class='text-lg font-normal text-gray-600'>/month</span></div><ul class='mb-8 space-y-3 text-gray-600'><li>✓ Up to 5 projects</li><li>✓ 10GB storage</li><li>✓ Email support</li><li>✓ Basic analytics</li></ul><a href='#' class='w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition block'>Get Started</a></div><div class='bg-blue-600 text-white rounded-2xl p-8 text-center relative'><div class='absolute -top-4 left-1/2 transform -translate-x-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold'>Popular</div><h3 class='text-2xl font-bold mb-4'>Professional</h3><div class='text-4xl font-bold mb-6'>$49<span class='text-lg font-normal opacity-80'>/month</span></div><ul class='mb-8 space-y-3'><li>✓ Unlimited projects</li><li>✓ 100GB storage</li><li>✓ Priority support</li><li>✓ Advanced analytics</li><li>✓ Custom domains</li></ul><a href='#' class='w-full bg-white text-blue-600 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition block'>Get Started</a></div></div></section>`
        },
        {
          name: '3-Tier Pricing',
          description: 'Complete 3-column pricing table',
          html: `<section class='py-16 px-8 bg-gray-50 rounded-2xl'><div class='text-center mb-12'><h2 class='text-3xl font-bold mb-4 text-gray-900'>Choose Your Plan</h2><p class='text-lg text-gray-600'>Flexible pricing for teams of all sizes</p></div><div class='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto'><div class='bg-white rounded-2xl p-6 text-center shadow-lg'><h3 class='text-xl font-bold mb-4 text-gray-900'>Basic</h3><div class='text-3xl font-bold mb-6 text-gray-900'>$9<span class='text-lg font-normal text-gray-600'>/mo</span></div><ul class='mb-6 space-y-2 text-gray-600 text-sm'><li>✓ 3 projects</li><li>✓ 5GB storage</li><li>✓ Email support</li></ul><a href='#' class='w-full bg-gray-200 text-gray-900 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition block'>Choose Plan</a></div><div class='bg-blue-600 text-white rounded-2xl p-6 text-center shadow-xl transform scale-105'><div class='bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block'>Most Popular</div><h3 class='text-xl font-bold mb-4'>Pro</h3><div class='text-3xl font-bold mb-6'>$29<span class='text-lg font-normal opacity-80'>/mo</span></div><ul class='mb-6 space-y-2 text-sm'><li>✓ 15 projects</li><li>✓ 50GB storage</li><li>✓ Priority support</li><li>✓ Advanced features</li></ul><a href='#' class='w-full bg-white text-blue-600 py-2 px-4 rounded-lg font-semibold hover:bg-gray-100 transition block'>Choose Plan</a></div><div class='bg-white rounded-2xl p-6 text-center shadow-lg'><h3 class='text-xl font-bold mb-4 text-gray-900'>Enterprise</h3><div class='text-3xl font-bold mb-6 text-gray-900'>$99<span class='text-lg font-normal text-gray-600'>/mo</span></div><ul class='mb-6 space-y-2 text-gray-600 text-sm'><li>✓ Unlimited projects</li><li>✓ 500GB storage</li><li>✓ 24/7 support</li><li>✓ Custom integrations</li></ul><a href='#' class='w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-800 transition block'>Choose Plan</a></div></div></section>`
        }
      ]
    },
    'testimonials': {
      name: 'Testimonials',
      icon: '💬',
      templates: [
        {
          name: 'Single Testimonial',
          description: 'Featured customer testimonial',
          html: `<section class='py-16 px-8 bg-blue-50 rounded-2xl'><div class='max-w-4xl mx-auto text-center'><div class='text-blue-600 mb-6 text-4xl'>"</div><blockquote class='text-2xl font-medium text-gray-900 mb-8 leading-relaxed'>This platform has completely transformed how we build and manage our websites. The intuitive interface and powerful features make it a joy to use.</blockquote><div class='flex items-center justify-center'><img src='https://randomuser.me/api/portraits/women/44.jpg' class='w-16 h-16 rounded-full mr-4' alt='Sarah Johnson' /><div class='text-left'><div class='font-semibold text-gray-900'>Sarah Johnson</div><div class='text-gray-600'>CEO, TechStart Inc.</div></div></div></div></section>`
        },
        {
          name: 'Testimonial Grid',
          description: 'Multiple customer testimonials',
          html: `<section class='py-16 px-8 bg-white rounded-2xl'><h2 class='text-3xl font-bold text-center mb-12 text-gray-900'>What Our Customers Say</h2><div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'><div class='bg-gray-50 rounded-xl p-6'><div class='flex items-center mb-4'><img src='https://randomuser.me/api/portraits/men/32.jpg' class='w-12 h-12 rounded-full mr-3' alt='John Smith' /><div><div class='font-semibold text-gray-900'>John Smith</div><div class='text-sm text-gray-600'>Marketing Director</div></div></div><p class='text-gray-700 italic'>"Incredible tool that saved us months of development time. Highly recommended!"</p></div><div class='bg-gray-50 rounded-xl p-6'><div class='flex items-center mb-4'><img src='https://randomuser.me/api/portraits/women/68.jpg' class='w-12 h-12 rounded-full mr-3' alt='Emily Davis' /><div><div class='font-semibold text-gray-900'>Emily Davis</div><div class='text-sm text-gray-600'>Product Manager</div></div></div><p class='text-gray-700 italic'>"The best website builder I've ever used. Clean, fast, and powerful."</p></div><div class='bg-gray-50 rounded-xl p-6'><div class='flex items-center mb-4'><img src='https://randomuser.me/api/portraits/men/75.jpg' class='w-12 h-12 rounded-full mr-3' alt='Michael Brown' /><div><div class='font-semibold text-gray-900'>Michael Brown</div><div class='text-sm text-gray-600'>Startup Founder</div></div></div><p class='text-gray-700 italic'>"Game-changer for our business. We launched our site in just days!"</p></div></div></section>`
        }
      ]
    },
    'contact': {
      name: 'Contact',
      icon: '📞',
      templates: [
        {
          name: 'Contact Form',
          description: 'Simple contact form with gradient background',
          html: `<section class='py-16 px-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl'><div class='max-w-2xl mx-auto text-center'><h2 class='text-3xl font-bold mb-4'>Get In Touch</h2><p class='text-lg mb-8 opacity-90'>Ready to start your project? We'd love to hear from you.</p><form class='space-y-4'><div class='grid grid-cols-1 md:grid-cols-2 gap-4'><input class='w-full px-4 py-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50' placeholder='First Name' type='text' /><input class='w-full px-4 py-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50' placeholder='Last Name' type='text' /></div><input class='w-full px-4 py-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50' placeholder='Email Address' type='email' /><textarea class='w-full px-4 py-3 rounded-lg border border-white/30 bg-white/20 text-white placeholder-white/80 focus:outline-none focus:ring-2 focus:ring-white/50 h-32 resize-none' placeholder='Your Message'></textarea><button class='w-full bg-white text-purple-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition transform hover:scale-105'>Send Message</button></form></div></section>`
        },
        {
          name: 'Contact Info',
          description: 'Contact information with icons',
          html: `<section class='py-16 px-8 bg-white rounded-2xl'><div class='max-w-4xl mx-auto'><h2 class='text-3xl font-bold text-center mb-12 text-gray-900'>Contact Information</h2><div class='grid grid-cols-1 md:grid-cols-3 gap-8 text-center'><div class='p-6'><div class='w-16 h-16 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full mb-4 mx-auto text-2xl'>📍</div><h4 class='text-xl font-bold mb-2 text-gray-900'>Address</h4><p class='text-gray-600'>123 Business Street<br/>Suite 100<br/>City, State 12345</p></div><div class='p-6'><div class='w-16 h-16 bg-green-100 text-green-600 flex items-center justify-center rounded-full mb-4 mx-auto text-2xl'>📞</div><h4 class='text-xl font-bold mb-2 text-gray-900'>Phone</h4><p class='text-gray-600'>+1 (555) 123-4567<br/>Mon-Fri 9AM-6PM</p></div><div class='p-6'><div class='w-16 h-16 bg-purple-100 text-purple-600 flex items-center justify-center rounded-full mb-4 mx-auto text-2xl'>✉️</div><h4 class='text-xl font-bold mb-2 text-gray-900'>Email</h4><p class='text-gray-600'>hello@company.com<br/>support@company.com</p></div></div></div></section>`
        }
      ]
    },
    'about': {
      name: 'About',
      icon: '👥',
      templates: [
        {
          name: 'About Us',
          description: 'Company introduction section',
          html: `<section class='py-16 px-8 bg-white rounded-2xl'><div class='max-w-4xl mx-auto'><div class='grid grid-cols-1 lg:grid-cols-2 gap-12 items-center'><div><h2 class='text-3xl font-bold mb-6 text-gray-900'>About Our Company</h2><p class='text-lg text-gray-600 mb-6 leading-relaxed'>We are a passionate team of innovators dedicated to creating exceptional digital experiences. Our mission is to empower businesses with cutting-edge technology and creative solutions.</p><p class='text-gray-600 mb-8'>Founded in 2020, we've helped over 1,000 companies transform their digital presence and achieve their goals through our comprehensive platform.</p><div class='grid grid-cols-2 gap-6'><div class='text-center'><div class='text-3xl font-bold text-blue-600 mb-2'>1000+</div><div class='text-gray-600'>Happy Clients</div></div><div class='text-center'><div class='text-3xl font-bold text-blue-600 mb-2'>50+</div><div class='text-gray-600'>Team Members</div></div></div></div><div class='bg-gray-100 rounded-2xl p-8 text-center'><div class='w-32 h-32 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl'>🏢</div><p class='text-gray-600'>Company Image Placeholder</p></div></div></div></section>`
        },
        {
          name: 'Team Section',
          description: 'Meet the team grid layout',
          html: `<section class='py-16 px-8 bg-gray-50 rounded-2xl'><div class='max-w-6xl mx-auto'><h2 class='text-3xl font-bold text-center mb-4 text-gray-900'>Meet Our Team</h2><p class='text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto'>Our diverse team of experts is passionate about delivering exceptional results for our clients.</p><div class='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'><div class='bg-white rounded-xl p-6 text-center shadow-lg'><img src='https://randomuser.me/api/portraits/women/32.jpg' class='w-24 h-24 rounded-full mx-auto mb-4' alt='Jane Doe' /><h4 class='text-xl font-bold mb-2 text-gray-900'>Jane Doe</h4><p class='text-blue-600 font-semibold mb-2'>CEO & Founder</p><p class='text-gray-600 text-sm'>Visionary leader with 15+ years of experience in tech innovation.</p></div><div class='bg-white rounded-xl p-6 text-center shadow-lg'><img src='https://randomuser.me/api/portraits/men/45.jpg' class='w-24 h-24 rounded-full mx-auto mb-4' alt='John Smith' /><h4 class='text-xl font-bold mb-2 text-gray-900'>John Smith</h4><p class='text-blue-600 font-semibold mb-2'>CTO</p><p class='text-gray-600 text-sm'>Technical expert passionate about building scalable solutions.</p></div><div class='bg-white rounded-xl p-6 text-center shadow-lg'><img src='https://randomuser.me/api/portraits/women/68.jpg' class='w-24 h-24 rounded-full mx-auto mb-4' alt='Sarah Wilson' /><h4 class='text-xl font-bold mb-2 text-gray-900'>Sarah Wilson</h4><p class='text-blue-600 font-semibold mb-2'>Head of Design</p><p class='text-gray-600 text-sm'>Creative designer focused on user experience and visual excellence.</p></div><div class='bg-white rounded-xl p-6 text-center shadow-lg'><img src='https://randomuser.me/api/portraits/men/22.jpg' class='w-24 h-24 rounded-full mx-auto mb-4' alt='Mike Johnson' /><h4 class='text-xl font-bold mb-2 text-gray-900'>Mike Johnson</h4><p class='text-blue-600 font-semibold mb-2'>Lead Developer</p><p class='text-gray-600 text-sm'>Full-stack developer with expertise in modern web technologies.</p></div></div></div></section>`
        }
      ]
    }
  };
  
  const allTemplates = Object.values(templateCategories).flatMap(category => 
    category.templates.map(template => ({ ...template, category: category.name }))
  );
  
  const filteredTemplates = selectedCategory === 'all' 
    ? allTemplates 
    : templateCategories[selectedCategory]?.templates || [];

  const categories = [
    { key: 'all', name: 'All Templates', icon: '📋' },
    ...Object.entries(templateCategories).map(([key, category]) => ({
      key,
      name: category.name,
      icon: category.icon
    }))
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Library</h2>
            <p className="text-gray-600 mt-1">Choose from our collection of professionally designed templates</p>
          </div>
          <button
            className="text-gray-400 hover:text-red-500 text-2xl font-bold focus:outline-none transition-colors"
            onClick={onClose}
            aria-label="Close templates modal"
          >
            ×
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 px-6">
          {categories.map(category => (
            <button
              key={category.key}
              className={`flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedCategory === category.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedCategory(category.key)}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <div
                key={`${template.name}-${index}`}
                className="bg-gray-50 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group border border-gray-200 hover:border-blue-300"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>
                  </div>
                </div>
                
                {/* Preview Area */}
                <div className="bg-white rounded-lg p-3 mb-4 border border-gray-200 min-h-[120px] flex items-center justify-center">
                  <div className="text-gray-400 text-sm text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                      📄
                    </div>
                    Template Preview
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                    onClick={() => {
                      onInsert(template.html);
                      onClose();
                    }}
                  >
                    Insert Template
                  </button>
                  <button
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    👁️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try selecting a different category or check back later for new templates.</p>
            </div>
          )}
        </div>

        {/* Preview Modal */}
        {previewTemplate && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{previewTemplate.name} Preview</h3>
                <button
                  className="text-gray-400 hover:text-red-500 text-xl font-bold focus:outline-none"
                  onClick={() => setPreviewTemplate(null)}
                >
                  ×
                </button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[70vh]">
                <div 
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.html }}
                />
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-200">
                <button
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    onInsert(previewTemplate.html);
                    setPreviewTemplate(null);
                    onClose();
                  }}
                >
                  Insert This Template
                </button>
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EnhancedTemplatesModal;