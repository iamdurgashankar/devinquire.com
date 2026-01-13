import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, BarChart3, ShoppingCart, Bot, Smartphone, Shield } from "lucide-react";
import PageLayout from '../components/PageLayout';
import Banner728x98 from '../components/Banner728x98';
import SEO from '../components/SEO';
import { responsiveTypography, responsiveSpacing, responsiveContainers } from '../utils/responsive';

// Product Images
import cmsImg from '../images/products/cms.png';
import analyticsImg from '../images/products/analytics.png';
import ecommerceImg from '../images/products/ecommerce.png';
import aiBotImg from '../images/products/ai-bot.png';
import mobileImg from '../images/services/mobile-dev.png'; // Reusing mobile dev for framework
import securityImg from '../images/products/security.png';

const products = [
  {
    image: cmsImg,
    icon: Globe,
    title: "DevInquire CMS",
    description: "A powerful content management system built for modern websites",
    features: ["Drag & Drop Editor", "SEO Optimization", "Multi-language Support", "Custom Themes", "Analytics Dashboard", "API Integration"],
    category: "Software",
    status: "Available",
    technologies: ["React", "Node.js", "MongoDB", "AWS"]
  },
  {
    image: analyticsImg,
    icon: BarChart3,
    title: "Analytics Pro",
    description: "Advanced analytics platform for tracking website performance and user behavior",
    features: ["Real-time Analytics", "Custom Reports", "User Journey Tracking", "A/B Testing", "Conversion Optimization", "Data Export"],
    category: "Analytics",
    status: "Available",
    technologies: ["React", "Python", "PostgreSQL", "Redis"]
  },
  {
    image: ecommerceImg,
    icon: ShoppingCart,
    title: "E-Commerce Suite",
    description: "Complete e-commerce solution with payment processing and inventory management",
    features: ["Product Catalog", "Payment Gateway", "Inventory Management", "Order Tracking", "Customer Portal", "Mobile App"],
    category: "E-Commerce",
    status: "Available",
    technologies: ["React", "Stripe", "Node.js", "MongoDB"]
  },
  {
    image: aiBotImg,
    icon: Bot,
    title: "AI Chatbot Builder",
    description: "Intelligent chatbot platform for customer support and lead generation",
    features: ["Natural Language Processing", "Multi-channel Support", "Custom Training", "Analytics", "Integration APIs", "24/7 Support"],
    category: "AI/ML",
    status: "Available",
    technologies: ["Python", "TensorFlow", "React", "WebSocket"]
  },
  {
    image: mobileImg,
    icon: Smartphone,
    title: "Mobile App Framework",
    description: "Cross-platform mobile development framework for rapid app creation",
    features: ["Cross-platform", "Native Performance", "UI Components", "Push Notifications", "Offline Support", "App Store Ready"],
    category: "Mobile",
    status: "Beta",
    technologies: ["React Native", "Flutter", "MySQL", "AWS"]
  },
  {
    image: securityImg,
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
    <>
      <SEO
        title="Our Products - Innovative Software Solutions"
        description="Discover DevInquire's innovative software products including CMS, analytics platforms, e-commerce suites, AI chatbots, and mobile frameworks. Accelerate your business growth with our tools."
        keywords="DevInquire CMS, analytics platform, e-commerce suite, AI chatbot, mobile app framework, security solutions, software products, business tools"
        canonical="https://devinquire.com/products"
        ogTitle="DevInquire Products - Innovative Software Solutions for Business Growth"
        ogDescription="Innovative software solutions from CMS to AI-powered tools. Accelerate your business growth with our comprehensive product suite."
        ogUrl="https://devinquire.com/products"
      />
      <PageLayout
        title="Our Products"
        subtitle="Innovative software solutions designed to accelerate your business growth. From content management to AI-powered tools, we've got you covered."
      >

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
                  className={`group relative px-6 py-2 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${selectedCategory === category
                      ? 'bg-[#0077b6] text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  {category}
                  {selectedCategory === category && (
                    <div className="absolute inset-0 bg-[#0077b6] rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className={`${responsiveSpacing.sectionPadding} relative`}>
          {/* Background decoration */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-20 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-100/50 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-100/30 rounded-full blur-3xl"></div>
          </div>

          <div className={`relative ${responsiveContainers.standard}`}>
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
                  {/* Product Image Header */}
                  <div className="h-48 overflow-hidden relative">
                    <motion.img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>

                    {/* Status Badge moved inside image area for better look */}
                    <div className="absolute top-4 right-4 z-20">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.status === 'Available' ? 'bg-green-500 text-white' :
                          product.status === 'Beta' ? 'bg-yellow-500 text-white' :
                            'bg-gray-500 text-white'
                        }`}>
                        {product.status}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 p-8 -mt-6">
                    <div className="flex justify-between items-start mb-4">
                      <motion.div
                        className="p-3 bg-blue-50 rounded-xl text-blue-600"
                        whileHover={{ scale: 1.1 }}
                      >
                        <product.icon className="w-6 h-6" />
                      </motion.div>
                    </div>
                    <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-2 group-hover:text-[#0077b6] transition-colors duration-300`}>{product.title}</h3>
                    <p className={`${responsiveTypography.bodyBase} text-gray-600 mb-6 line-clamp-2`}>{product.description}</p>

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
                        className="w-full bg-[#0077b6] hover:bg-[#005a8a] text-white py-3 px-6 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 group-hover:shadow-lg text-center block"
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

        {/* CTA Banner Section */}
        <section className={`${responsiveSpacing.sectionPadding} flex justify-center`}>
          <Banner728x98
            title="Ready to Transform Your Business?"
            subtitle="Join thousands of businesses already using our products to streamline operations and drive growth."
            primaryButtonText="Contact Sales"
            primaryButtonLink="/contact"
            secondaryButtonText="View Services"
            secondaryButtonLink="/services"
          />
        </section>
      </PageLayout>
    </>
  );
}