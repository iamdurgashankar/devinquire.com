import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Monitor, Rocket, Puzzle, Smartphone, Search, Palette, FileText, ShoppingCart, TrendingUp } from "lucide-react";

const services = [
  {
    icon: Monitor,
    title: "Website Development",
    description: "Custom websites built with modern technologies and responsive design",
    features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Modern UI/UX", "Content Management", "Analytics Integration"],
    // price: "Starting from $2,500",
    technologies: ["React", "Next.js", "Node.js", "MongoDB", "AWS", "Vercel"]
  },
  {
    icon: Rocket,
    title: "Web Application Development",
    description: "Full-stack web applications with advanced functionality and scalability",
    features: ["Custom Backend", "Database Design", "API Development", "User Authentication", "Real-time Features", "Cloud Deployment"],
    // price: "Starting from $8,000",
    technologies: ["React", "Vue.js", "Express.js", "PostgreSQL", "Redis", "Docker"]
  },
  {
    icon: Puzzle,
    title: "Component Development",
    description: "Reusable UI components and libraries for consistent design systems",
    features: ["React Components", "Vue Components", "Design System", "Documentation", "Testing", "Version Control"],
    // price: "Starting from $1,500",
    technologies: ["Storybook", "Jest", "TypeScript", "Styled Components", "Framer Motion", "Git"]
  },
  {
    icon: Smartphone,
    title: "Mobile Application Development",
    description: "Native and cross-platform mobile apps for iOS and Android",
    features: ["iOS Development", "Android Development", "Cross-platform", "Push Notifications", "Offline Support", "App Store Deployment"],
    //price: "Starting from $15,000",
    technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "App Store"]
  },
  {
    icon: Search,
    title: "SEO Services",
    description: "Search engine optimization to improve your online visibility and rankings",
    features: ["Keyword Research", "On-page SEO", "Technical SEO", "Content Strategy", "Link Building", "Performance Monitoring"],
    //price: "Starting from $500/month",
    technologies: ["Google Analytics", "Search Console", "Ahrefs", "SEMrush", "Core Web Vitals", "Schema Markup"]
  },
  {
    icon: Palette,
    title: "Logo & Banner Design",
    description: "Professional branding and visual design for your business",
    features: ["Logo Design", "Brand Guidelines", "Social Media Graphics", "Print Materials", "Web Graphics", "Animation"],
    //price: "Starting from $800",
    technologies: ["Adobe Illustrator", "Photoshop", "Figma", "After Effects", "InDesign", "Sketch"]
  },
  {
    icon: FileText,
    title: "Blog & Content Management",
    description: "Content creation and management systems for your digital presence",
    features: ["Content Strategy", "Blog Writing", "CMS Setup", "SEO Content", "Social Media", "Analytics"],
    //price: "Starting from $300/month",
    technologies: ["WordPress", "Ghost", "Strapi", "Contentful", "Hugo", "Gatsby"]
  },
  {
    icon: ShoppingCart,
    title: "E-commerce Development",
    description: "Complete online store solutions with secure payment processing and inventory management",
    features: ["Custom Store Design", "Payment Integration", "Inventory Management", "Order Processing", "Customer Accounts", "Analytics Dashboard"],
    //price: "Starting from $5,000",
    technologies: ["Shopify", "WooCommerce", "Stripe", "PayPal", "React", "Node.js"]
  },
  {
    icon: TrendingUp,
    title: "Digital Marketing Strategy",
    description: "Comprehensive marketing campaigns to boost your online presence and drive conversions",
    features: ["Market Research", "Campaign Strategy", "Social Media Marketing", "Email Marketing", "PPC Advertising", "Performance Analytics"],
    //price: "Starting from $1,200/month",
    technologies: ["Google Ads", "Facebook Ads", "Mailchimp", "HubSpot", "Google Analytics", "Hootsuite"]
  }
];

export default function Services() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Our Services</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Comprehensive digital solutions tailored to your unique business needs. 
            From concept to deployment, we handle every aspect of your digital transformation.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 relative">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100 overflow-hidden relative">
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 p-8">
                  <motion.div
                    className="text-5xl mb-4 text-blue-600"
                    whileHover={{
                      scale: 1.05,
                      y: -2
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeInOut"
                    }}
                  >
                    <service.icon className="w-12 h-12" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      What's Included:
                    </h4>
                    <ul className="space-y-2">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Technologies */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                      Technologies:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {service.technologies.map((tech, techIndex) => (
                        <span key={techIndex} className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-all duration-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <Link 
                      to="/contact" 
                      className="block w-full bg-gradient-to-r from-[#4169e1] via-[#6366f1] to-[#9c27b0] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg text-center"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-24 h-24 bg-yellow-100/50 rounded-full blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">Our Process</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              We follow a proven methodology to deliver exceptional results
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Discovery",
                description: "We start by understanding your business goals, target audience, and project requirements.",
                icon: "🔍"
              },
              {
                step: "02",
                title: "Planning",
                description: "We create a detailed project plan, wireframes, and technical architecture.",
                icon: "📋"
              },
              {
                step: "03",
                title: "Development",
                description: "Our team builds your solution using modern technologies and best practices.",
                icon: "⚡"
              },
              {
                step: "04",
                title: "Launch",
                description: "We deploy your project and provide ongoing support and maintenance.",
                icon: "🚀"
              }
            ].map((process, index) => (
              <div key={index} className="text-center group">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 group-hover:scale-110 transition-all duration-500 shadow-lg">
                    {process.step}
                  </div>
                  <div className="absolute -inset-2 bg-gradient-to-r from-[#4169e1] to-[#9c27b0] rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                </div>
                <div className="text-3xl mb-3 group-hover:animate-bounce">{process.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-[#4169e1] transition-colors duration-300">{process.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Dynamic CTA Banner Section */}
      <section className="relative py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white overflow-hidden">
        {/* Dynamic Background Effects */}
        <div className="absolute inset-0">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#4169e1]/30 via-transparent to-[#9c27b0]/30 animate-pulse"></div>
          
          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{animationDelay: '0s', animationDuration: '3s'}}></div>
          <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-blue-300/60 rounded-full animate-bounce" style={{animationDelay: '1s', animationDuration: '4s'}}></div>
          <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-purple-300/50 rounded-full animate-bounce" style={{animationDelay: '2s', animationDuration: '5s'}}></div>
          <div className="absolute top-1/2 right-1/3 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{animationDelay: '0.5s', animationDuration: '3.5s'}}></div>
          <div className="absolute bottom-1/3 right-1/5 w-1 h-1 bg-blue-400/70 rounded-full animate-bounce" style={{animationDelay: '1.5s', animationDuration: '4.5s'}}></div>
          
          {/* Large animated background shapes */}
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-gradient-to-r from-[#4169e1]/20 to-[#6366f1]/20 rounded-full blur-3xl animate-pulse" style={{animationDuration: '6s'}}></div>
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-gradient-to-r from-[#9c27b0]/20 to-[#8b5cf6]/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s', animationDuration: '8s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-white/5 to-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s', animationDuration: '10s'}}></div>
          
          {/* Moving geometric shapes */}
          <div className="absolute top-20 left-20 w-8 h-8 border-2 border-white/20 rotate-45 animate-spin" style={{animationDuration: '20s'}}></div>
          <div className="absolute bottom-20 right-20 w-6 h-6 border-2 border-blue-300/30 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
        </div>
        
        {/* Content */}
        <div className="relative max-w-6xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          {/* Banner-style header with enhanced typography */}
          <div className="mb-12">
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-[#4169e1]/20 to-[#9c27b0]/20 rounded-full border border-white/20 mb-6 backdrop-blur-sm">
              <span className="text-sm font-semibold text-blue-200 uppercase tracking-wider">🚀 Let's Build Something Amazing</span>
            </div>
            
            <h2 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent animate-fade-in-up">
              Ready to Start
              <br />
              <span className="bg-gradient-to-r from-[#4169e1] to-[#9c27b0] bg-clip-text text-transparent">Your Project?</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Transform your vision into reality with our expert team. 
              <br className="hidden md:block" />
              Let's create a custom solution that drives exceptional results.
            </p>
          </div>
          
          {/* Enhanced CTA buttons with banner styling */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 px-4">
            <button className="group relative bg-gradient-to-r from-[#4169e1] to-[#6366f1] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white px-6 sm:px-8 md:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-500 transform hover:scale-105 sm:hover:scale-110 hover:rotate-1 shadow-2xl hover:shadow-[#4169e1]/50 overflow-hidden w-full sm:w-auto">
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-base sm:text-lg">📅</span>
                <span className="text-sm sm:text-base md:text-lg">Schedule a Consultation</span>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute -inset-2 bg-gradient-to-r from-[#4169e1] to-[#9c27b0] rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            </button>
            
            <Link 
              to="/blog" 
              className="group relative border-2 sm:border-3 border-white/30 hover:border-white text-white hover:bg-white hover:text-gray-900 px-6 sm:px-8 md:px-12 py-4 sm:py-5 rounded-2xl font-bold text-lg sm:text-xl transition-all duration-500 transform hover:scale-105 sm:hover:scale-110 hover:-rotate-1 backdrop-blur-sm overflow-hidden w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                <span className="text-base sm:text-lg">🎨</span>
                <span className="text-sm sm:text-base md:text-lg">View Our Work</span>
                <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
            </Link>
          </div>
          
          {/* Banner-style features showcase */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { icon: "⚡", title: "Fast Delivery", desc: "Quick turnaround times" },
              { icon: "🎯", title: "Expert Team", desc: "Industry professionals" },
              { icon: "🛡️", title: "Quality Assured", desc: "Rigorous testing process" }
            ].map((feature, index) => (
              <div key={index} className="group bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
          
          {/* Call-to-action footer */}
          <div className="mt-12 text-center">
            <p className="text-gray-400 text-lg mb-4">Join 500+ satisfied clients worldwide</p>
            <div className="flex justify-center items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                ⭐ 4.9/5 Rating
              </span>
              <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
              <span className="flex items-center gap-1">
                🏆 Award Winning
              </span>
              <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
              <span className="flex items-center gap-1">
                🚀 500+ Projects
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}