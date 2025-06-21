import { Link } from "react-router-dom";

const services = [
  {
    icon: "💻",
    title: "Website Development",
    description: "Custom websites built with modern technologies and responsive design",
    features: ["Responsive Design", "SEO Optimized", "Fast Loading", "Modern UI/UX", "Content Management", "Analytics Integration"],
    price: "Starting from $2,500",
    technologies: ["React", "Next.js", "Node.js", "MongoDB", "AWS", "Vercel"]
  },
  {
    icon: "🚀",
    title: "Web Application Development",
    description: "Full-stack web applications with advanced functionality and scalability",
    features: ["Custom Backend", "Database Design", "API Development", "User Authentication", "Real-time Features", "Cloud Deployment"],
    price: "Starting from $8,000",
    technologies: ["React", "Vue.js", "Express.js", "PostgreSQL", "Redis", "Docker"]
  },
  {
    icon: "🧩",
    title: "Component Development",
    description: "Reusable UI components and libraries for consistent design systems",
    features: ["React Components", "Vue Components", "Design System", "Documentation", "Testing", "Version Control"],
    price: "Starting from $1,500",
    technologies: ["Storybook", "Jest", "TypeScript", "Styled Components", "Framer Motion", "Git"]
  },
  {
    icon: "📱",
    title: "Mobile Application Development",
    description: "Native and cross-platform mobile apps for iOS and Android",
    features: ["iOS Development", "Android Development", "Cross-platform", "Push Notifications", "Offline Support", "App Store Deployment"],
    price: "Starting from $15,000",
    technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "App Store"]
  },
  {
    icon: "🔍",
    title: "SEO Services",
    description: "Search engine optimization to improve your online visibility and rankings",
    features: ["Keyword Research", "On-page SEO", "Technical SEO", "Content Strategy", "Link Building", "Performance Monitoring"],
    price: "Starting from $500/month",
    technologies: ["Google Analytics", "Search Console", "Ahrefs", "SEMrush", "Core Web Vitals", "Schema Markup"]
  },
  {
    icon: "🎨",
    title: "Logo & Banner Design",
    description: "Professional branding and visual design for your business",
    features: ["Logo Design", "Brand Guidelines", "Social Media Graphics", "Print Materials", "Web Graphics", "Animation"],
    price: "Starting from $800",
    technologies: ["Adobe Illustrator", "Photoshop", "Figma", "After Effects", "InDesign", "Sketch"]
  },
  {
    icon: "📝",
    title: "Blog & Content Management",
    description: "Content creation and management systems for your digital presence",
    features: ["Content Strategy", "Blog Writing", "CMS Setup", "SEO Content", "Social Media", "Analytics"],
    price: "Starting from $300/month",
    technologies: ["WordPress", "Ghost", "Strapi", "Contentful", "Hugo", "Gatsby"]
  }
];

export default function Services() {
  return (
    <div className="min-h-screen bg-gray-50">
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
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{service.title}</h3>
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
                    <div className="text-2xl font-bold text-blue-600 mb-4 group-hover:scale-105 transition-transform duration-300">{service.price}</div>
                    <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg">
                      Get Started
                    </button>
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
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
                </div>
                <div className="text-3xl mb-3 group-hover:animate-bounce">{process.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{process.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">Why Choose DevInquire?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              We combine technical expertise with creative innovation to deliver outstanding results
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Expert Team",
                description: "Our experienced developers and designers bring years of industry expertise to every project."
              },
              {
                icon: "⚡",
                title: "Fast Delivery",
                description: "We prioritize efficiency without compromising quality, ensuring timely project completion."
              },
              {
                icon: "🛡️",
                title: "Quality Assurance",
                description: "Rigorous testing and quality checks ensure your project meets the highest standards."
              }
            ].map((feature, index) => (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{feature.title}</h3>
                <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 animate-fade-in-up">Ready to Start Your Project?</h2>
          <p className="text-xl text-gray-300 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Let's discuss your requirements and create a custom solution that drives results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 overflow-hidden">
              <span className="relative z-10">Schedule a Consultation</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </button>
            <Link 
              to="/blog" 
              className="group relative border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">View Our Work</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 