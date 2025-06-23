import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-white via-[#ae97ef]/20 to-white text-slate-800 overflow-hidden min-h-screen flex items-center">
        {/* Enhanced Light Glass Effect Background */}
        <div className="absolute inset-0">
          {/* Light animated gradient mesh with glass effect */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-20 left-10 w-96 h-96 bg-[#ae97ef]/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-40 right-20 w-[500px] h-[500px] bg-[#ae97ef]/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-40 left-20 w-80 h-80 bg-[#ae97ef]/12 rounded-full blur-3xl animate-pulse delay-2000"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-[#ae97ef]/6 rounded-full blur-3xl animate-pulse delay-3000"></div>
          </div>
          
          {/* Enhanced grid pattern with light glass effect */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(174,151,239,0.15) 1px, transparent 0)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>

          {/* Additional light glass effect layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-[#ae97ef]/5 to-white/40"></div>

          {/* Bubbles floating animation - now above overlays for visibility */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {[...Array(18)].map((_, i) => {
              const size = 32 + Math.random() * 48; // 32px to 80px
              const left = Math.random() * 100; // percent
              const delay = Math.random() * 6; // seconds
              const duration = 8 + Math.random() * 6; // seconds
              const opacity = 0.25 + Math.random() * 0.25; // more visible
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-blue-400/40 shadow-lg border border-blue-300/40"
                  style={{
                    width: size,
                    height: size,
                    left: `${left}%`,
                    top: `-${size}px`,
                    opacity,
                  }}
                  initial={{ y: 0, scale: 1, opacity }}
                  animate={{ y: 600 + size, scale: 1.1 + Math.random() * 0.2, opacity: 0.15 }}
                  transition={{
                    duration,
                    delay,
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut",
                  }}
                />
              );
            })}
          </div>

          {/* Enhanced floating code elements */}
          <div className="absolute inset-0">
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-[#ae97ef]/30 font-mono text-sm"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, Math.random() * 20 - 10, 0],
                  opacity: [0.1, 0.4, 0.1],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 6 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 4,
                }}
              >
                {['<div>', '</div>', '{', '}', 'const', 'function', 'return', 'import', 'export', 'useState', 'useEffect', 'className', 'onClick', 'props', 'state', 'async', 'await', 'try', 'catch', 'finally', 'if', 'else', 'for', 'while', 'switch'][Math.floor(Math.random() * 25)]}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 z-10">
          <div className="text-center">
            {/* Enhanced Professional Badge */}
            <motion.div 
              className="mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <span className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-white/60 text-slate-700 border border-white/40 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
                Professional Development Solutions
                <span className="ml-3 text-xs text-slate-600">✨</span>
              </span>
            </motion.div>
            
            {/* Animated Subtitle */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
            >
              <div className="text-2xl md:text-3xl text-slate-600 max-w-4xl mx-auto leading-relaxed font-light">
                <motion.span 
                  className="text-slate-800 font-medium"
                  animate={{ opacity: [1, 0.8, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Building Tomorrow's Digital Solutions
                </motion.span>
                <br />
                <span className="text-slate-500">Full-Stack Development • Mobile Apps • Cloud Solutions</span>
              </div>
            </motion.div>

            {/* Professional Description */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9 }}
            >
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                We specialize in creating scalable, high-performance applications using cutting-edge technologies. 
                From concept to deployment, we deliver exceptional digital experiences that drive business growth.
              </p>
            </motion.div>

            {/* Professional CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.1 }}
            >
              <Link 
                to="/services" 
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl overflow-hidden border border-blue-500/30"
              >
                <span className="relative z-10 flex items-center justify-center">
                  View Our Services
                  <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <Link 
                to="/contact" 
                className="group relative border-2 border-slate-300 text-slate-700 hover:bg-slate-700 hover:text-white px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 overflow-hidden backdrop-blur-sm"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Start Your Project
                  <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-slate-700 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
            </motion.div>

            {/* Professional Stats */}
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.3 }}
            >
              {[
                { number: "100+", label: "Projects Delivered", icon: "🚀" },
                { number: "50+", label: "Happy Clients", icon: "👥" },
                { number: "6+", label: "Years Experience", icon: "⏰" },
                { number: "100%", label: "Client Satisfaction", icon: "⭐" }
              ].map((stat, index) => (
                <motion.div 
                  key={index} 
                  className="group cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-white/60 backdrop-blur-md rounded-2xl p-6 hover:bg-white/80 transition-all duration-300 border border-white/50 shadow-lg">
                    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
                    <div className="text-3xl font-bold text-slate-800 group-hover:text-blue-600 transition-colors duration-300">{stat.number}</div>
                    <div className="text-slate-600 text-sm font-medium">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Professional Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <div className="w-6 h-10 border-2 border-black/30 rounded-full flex justify-center backdrop-blur-sm">
            <motion.div 
              className="w-1 h-3 bg-black/50 rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            ></motion.div>
          </div>
        </motion.div>

        {/* Floating tech stack with animations */}
        <div className="absolute top-1/4 right-10 hidden lg:block">
          <div className="space-y-4">
            {[
              { icon: "⚛️", name: "React", color: "from-blue-400 to-cyan-400" },
              { icon: "⚡", name: "Next.js", color: "from-purple-400 to-pink-400" },
              { icon: "🔧", name: "Node.js", color: "from-green-400 to-emerald-400" },
              { icon: "🎨", name: "Tailwind", color: "from-cyan-400 to-blue-400" },
              { icon: "📱", name: "Mobile", color: "from-indigo-400 to-purple-400" },
              { icon: "🌐", name: "Web3", color: "from-orange-400 to-red-400" }
            ].map((tech, index) => (
              <motion.div 
                key={index}
                className="group w-16 h-16 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 relative overflow-hidden"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                whileHover={{ scale: 1.1 }}
              >
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-r ${tech.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                />
                <span className="group-hover:scale-110 transition-transform duration-300 relative z-10">{tech.icon}</span>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-20">
                  {tech.name}
              </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Animated code editor mockup */}
        <div className="absolute bottom-20 left-10 hidden xl:block">
          <motion.div 
            className="w-80 bg-slate-800/80 backdrop-blur-md rounded-lg border border-slate-600/50 overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 1.2 }}
          >
            <div className="flex items-center space-x-2 p-3 bg-slate-700/50 border-b border-slate-600/50">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-xs text-slate-400 ml-2">main.js</div>
            </div>
            <div className="p-4 font-mono text-sm">
              <motion.div 
                className="text-green-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                const app = new App();
              </motion.div>
              <div className="text-blue-400">app.initialize();</div>
              <motion.div 
                className="text-yellow-400"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                app.deploy();
              </motion.div>
              <div className="text-gray-400">// Success! 🚀</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Preview - Enhanced */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-24 h-24 bg-blue-100/50 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 bg-purple-100/50 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              className="text-4xl font-bold text-gray-900 mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              Our Services
            </motion.h2>
            <motion.p 
              className="text-xl text-gray-600"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              Comprehensive solutions for your digital needs
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "💻",
                title: "Web Development",
                description: "Modern, responsive websites and web applications",
                features: ["React/Next.js", "Node.js", "Database Design", "API Integration"]
              },
              {
                icon: "📱",
                title: "Mobile Development",
                description: "Native and cross-platform mobile applications",
                features: ["React Native", "iOS/Android", "App Store", "Performance"]
              },
              {
                icon: "🎨",
                title: "UI/UX Design",
                description: "Beautiful and intuitive user interfaces",
                features: ["Wireframing", "Prototyping", "User Testing", "Design Systems"]
              },
              {
                icon: "☁️",
                title: "Cloud Solutions",
                description: "Scalable cloud infrastructure and deployment",
                features: ["AWS/Azure", "Docker", "CI/CD", "Monitoring"]
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
              <motion.div 
                key={index} 
                className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100 relative overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
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
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/services" 
              className="group inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold text-lg transition-all duration-300"
            >
              View All Services
              <svg className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
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
              { number: "6+", label: "Years Experience", icon: "⭐" },
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