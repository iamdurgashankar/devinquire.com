import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, BarChart3, ShoppingCart, Bot, Smartphone, Shield } from "lucide-react";

const products = [
  {
    icon: Globe,
    title: "DevInquire CMS",
    description: "A powerful content management system built for modern websites",
    features: ["Drag & Drop Editor", "SEO Optimization", "Multi-language Support", "Custom Themes", "Analytics Dashboard", "API Integration"],
    category: "Software",
    status: "Available",
    technologies: ["React", "Node.js", "MongoDB", "AWS"]
  },
  {
    icon: BarChart3,
    title: "Analytics Pro",
    description: "Advanced analytics platform for tracking website performance and user behavior",
    features: ["Real-time Analytics", "Custom Reports", "User Journey Tracking", "A/B Testing", "Conversion Optimization", "Data Export"],
    category: "Analytics",
    status: "Available",
    technologies: ["React", "Python", "PostgreSQL", "Redis"]
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce Suite",
    description: "Complete e-commerce solution with payment processing and inventory management",
    features: ["Product Catalog", "Payment Gateway", "Inventory Management", "Order Tracking", "Customer Portal", "Mobile App"],
    category: "E-Commerce",
    status: "Available",
    technologies: ["React", "Stripe", "Node.js", "MongoDB"]
  },
  {
    icon: Bot,
    title: "AI Chatbot Builder",
    description: "Intelligent chatbot platform for customer support and lead generation",
    features: ["Natural Language Processing", "Multi-channel Support", "Custom Training", "Analytics", "Integration APIs", "24/7 Support"],
    category: "AI/ML",
    status: "Available",
    technologies: ["Python", "TensorFlow", "React", "WebSocket"]
  },
  {
    icon: Smartphone,
    title: "Mobile App Framework",
    description: "Cross-platform mobile development framework for rapid app creation",
    features: ["Cross-platform", "Native Performance", "UI Components", "Push Notifications", "Offline Support", "App Store Ready"],
    category: "Mobile",
    status: "Beta",
    technologies: ["React Native", "Flutter", "Firebase", "AWS"]
  },
  {
    icon: Shield,
    title: "Security Shield",
    description: "Comprehensive security solution for web applications and APIs",
    features: ["Threat Detection", "SSL Management", "Access Control", "Audit Logs", "Compliance Reports", "Real-time Monitoring"],
    category: "Security",
    status: "Coming Soon",
    technologies: ["Node.js", "Redis", "Docker", "Kubernetes"]
  }
];

const categories = ["All", "Software", "Analytics", "E-Commerce", "AI/ML", "Mobile", "Security"];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Filter products based on selected category
  const filteredProducts = selectedCategory === "All" 
    ? products 
    : products.filter(product => product.category === selectedCategory);

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
          <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">Our Products</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            Innovative software solutions designed to accelerate your business growth. 
            From content management to AI-powered tools, we've got you covered.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="py-8 bg-white border-b border-gray-200 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-10 w-16 h-16 bg-blue-100/50 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 right-10 w-20 h-20 bg-purple-100/50 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-4 justify-center">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setSelectedCategory(category)}
                className={`group relative px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#4169e1] via-[#6366f1] to-[#9c27b0] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
                {selectedCategory === category && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 relative">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-gray-100 overflow-hidden relative"
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4 z-20">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    product.status === 'Available' ? 'bg-green-100 text-green-800' :
                    product.status === 'Beta' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status}
                  </span>
                </div>

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
                    <product.icon className="w-12 h-12" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.title}</h3>
                  <p className="text-gray-600 mb-6">{product.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Key Features:
                    </h4>
                    <ul className="space-y-2">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Technologies:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.technologies.map((tech, techIndex) => (
                        <span key={techIndex} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors duration-300">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-gray-100">
                    <Link 
                      to="/contact" 
                      className="w-full bg-gradient-to-r from-[#4169e1] via-[#6366f1] to-[#9c27b0] hover:from-[#6366f1] hover:to-[#8b5cf6] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg text-center block"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Business?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Join thousands of businesses already using our products to streamline operations and drive growth.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="bg-white text-blue-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Contact Sales
              </Link>
              <Link 
                to="/services" 
                className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-blue-600 transition-all duration-300 transform hover:scale-105"
              >
                View Services
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}