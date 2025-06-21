import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden min-h-screen flex items-center">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating geometric shapes */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/20 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/20 rounded-full animate-bounce"></div>
          <div className="absolute bottom-40 left-20 w-24 h-24 bg-indigo-500/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 right-10 w-12 h-12 bg-pink-500/20 rounded-full animate-pulse"></div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-600/30 to-purple-600/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10">
          <div className="text-center">
            {/* Interactive Logo */}
            <div className="mb-8">
              <div className="inline-block relative group">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl transform group-hover:scale-110 transition-all duration-500 animate-pulse">
                  D
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500"></div>
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent animate-fade-in">
              DevInquire
            </h1>
            
            {/* Animated subtitle */}
            <div className="mb-8">
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
                <span className="inline-block animate-fade-in-up" style={{animationDelay: '0.2s'}}>Transforming ideas into </span>
                <span className="inline-block animate-fade-in-up text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300 font-semibold" style={{animationDelay: '0.4s'}}> exceptional digital experiences</span>
                <span className="inline-block animate-fade-in-up" style={{animationDelay: '0.6s'}}>. We craft cutting-edge websites, </span>
                <span className="inline-block animate-fade-in-up" style={{animationDelay: '0.8s'}}>applications, and digital solutions</span>
                <span className="inline-block animate-fade-in-up" style={{animationDelay: '1.0s'}}> that drive your business forward.</span>
              </p>
            </div>

            {/* Interactive CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
              <Link 
                to="/services" 
                className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden"
              >
                <span className="relative z-10">Explore Services</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
              </Link>
              
              <Link 
                to="/blog" 
                className="group relative border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10">Read Our Blog</span>
                <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </div>

            {/* Interactive Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { number: "100+", label: "Projects", icon: "🚀" },
                { number: "50+", label: "Clients", icon: "👥" },
                { number: "5+", label: "Years", icon: "⏰" },
                { number: "24/7", label: "Support", icon: "🛠️" }
              ].map((stat, index) => (
                <div key={index} className="group cursor-pointer">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 border border-white/20">
                    <div className="text-3xl mb-2 group-hover:animate-bounce">{stat.icon}</div>
                    <div className="text-3xl font-bold text-blue-300 group-hover:text-white transition-colors duration-300">{stat.number}</div>
                    <div className="text-blue-100 text-sm">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>

        {/* Floating tech icons */}
        <div className="absolute top-1/4 right-10 hidden lg:block">
          <div className="space-y-4">
            {["⚛️", "⚡", "🔧", "🎨", "📱", "🌐"].map((icon, index) => (
              <div 
                key={index}
                className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-2xl animate-float"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                {icon}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">Our Services</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Comprehensive digital solutions tailored to your unique business needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "💻",
                title: "Web Development",
                description: "Custom websites and web applications built with modern technologies",
                features: ["React", "Node.js", "Responsive Design", "SEO Optimized"]
              },
              {
                icon: "📱",
                title: "Mobile Apps",
                description: "Native and cross-platform mobile applications for iOS and Android",
                features: ["React Native", "Flutter", "Native iOS", "Native Android"]
              },
              {
                icon: "🎨",
                title: "UI/UX Design",
                description: "Beautiful, intuitive designs that enhance user experience",
                features: ["Figma", "Adobe XD", "Prototyping", "User Testing"]
              },
              {
                icon: "🔍",
                title: "SEO Services",
                description: "Search engine optimization to boost your online visibility",
                features: ["Keyword Research", "Technical SEO", "Content Strategy", "Analytics"]
              },
              {
                icon: "🚀",
                title: "Performance",
                description: "Optimization and maintenance to keep your applications fast",
                features: ["Speed Optimization", "Caching", "CDN", "Monitoring"]
              },
              {
                icon: "🛠️",
                title: "Custom Solutions",
                description: "Tailored development solutions for your specific requirements",
                features: ["API Development", "Database Design", "Cloud Solutions", "Integration"]
              }
            ].map((service, index) => (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100 relative overflow-hidden">
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">{service.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">{service.title}</h3>
                  <p className="text-gray-600 mb-4">{service.description}</p>
                  
                  {/* Features list */}
                  <div className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center text-sm text-gray-500 group-hover:text-gray-700 transition-colors duration-300">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 group-hover:scale-150 transition-transform duration-300"></div>
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Link 
              to="/services" 
              className="group inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-lg transition-all duration-300"
            >
              View All Services
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "100+", label: "Projects Completed", icon: "🎯" },
              { number: "50+", label: "Happy Clients", icon: "😊" },
              { number: "5+", label: "Years Experience", icon: "⭐" },
              { number: "24/7", label: "Support Available", icon: "🛡️" }
            ].map((stat, index) => (
              <div key={index} className="group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-500 transform hover:scale-105 border border-white/20">
                  <div className="text-4xl mb-4 group-hover:animate-bounce">{stat.icon}</div>
                  <div className="text-4xl md:text-5xl font-bold group-hover:text-yellow-300 transition-colors duration-300">{stat.number}</div>
                  <div className="text-blue-100 group-hover:text-white transition-colors duration-300">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-24 h-24 bg-yellow-100/50 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 animate-fade-in-up">What Our Clients Say</h2>
            <p className="text-xl text-gray-600 animate-fade-in-up" style={{animationDelay: '0.2s'}}>Don't just take our word for it</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Sankalp",
                role: "CEO, DCIT",
                content: "DevInquire transformed our outdated website into a modern, high-performing platform that increased our conversions by 300%.",
                avatar: "SJ",
                rating: 5
              },
              {
                name: "Shivraj",
                role: "Founder, DCIT",
                content: "The team at DevInquire delivered our mobile app on time and exceeded our expectations. Highly recommended!",
                avatar: "MC",
                rating: 5
              },
              {
                name: "Sunil",
                role: "Marketing Director, Kinspire Biz",
                content: "Their SEO services helped us climb to the top of search results. Our organic traffic has never been better.",
                avatar: "ER",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 relative overflow-hidden">
                {/* Hover background effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Avatar */}
                  <div className="flex items-center mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 group-hover:scale-110 transition-transform duration-300">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    <div className="text-yellow-400 flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <svg key={i} className="w-5 h-5 fill-current group-hover:scale-110 transition-transform duration-300" style={{animationDelay: `${i * 0.1}s`}} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 italic group-hover:text-gray-800 transition-colors duration-300">"{testimonial.content}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-blue-900 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/3 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold mb-6 animate-fade-in-up">Ready to Start Your Project?</h2>
          <p className="text-xl text-gray-300 mb-8 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Let's discuss how we can help bring your vision to life with cutting-edge technology and exceptional design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/services" 
              className="group relative bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 overflow-hidden"
            >
              <span className="relative z-10">Get Started Today</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
            </Link>
            <Link 
              to="/blog" 
              className="group relative border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10">Learn More</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
} 