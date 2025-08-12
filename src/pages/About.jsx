import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, Handshake, Gem } from 'lucide-react';

const About = () => {

  const teamMembers = [
    {
      name: "Durga Shankar",
      role: "Lead Developer",
      image: require('../images/Durga.JPG'),
      bio: "Full-stack developer with 6+ years of experience in modern web technologies and cloud platforms.",
      skills: ["React", "Node.js", "Python", "AWS"],
      social: { linkedin: "https://www.linkedin.com/in/durga-shankar-das-mangaraj", github: "https://github.com/iamdurgashankar" }
    },
    {
      name: "Anurag Mohapatra",
      role: "Mobile Application Developer",
      image: require('../images/Anurag.JPG'),
      bio: "Passionate about creating scalable mobile solutions and mentoring junior developers.",
      skills: ["React Native", "Flutter", "iOS", "Android"],
      social: { linkedin: "https://www.linkedin.com/in/anurag-mohapatra-a87505144/", github: "#" }
    },
    {
      name: "Akash K",
      role: "UI/UX Designer",
      image: require('../images/Akash.jpeg'),
      bio: "Creative designer focused on user-centered design and accessibility.",
      skills: ["Figma", "Adobe XD", "Prototyping", "User Research"],
      social: { linkedin: "https://www.linkedin.com/in/ak-as-k/", behance: "#" }
    },
    {
      name: "Hari Shankar",
      role: "DevOps Engineer",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      bio: "Infrastructure expert ensuring smooth deployments and system reliability.",
      skills: ["AWS", "Terraform", "Jenkins", "Monitoring"],
      social: { linkedin: "#", github: "#" }
    },
    {
      name: "Karishma Ray",
      role: "Digital Marketing & SEO Specialist",
      image: require('../images/Karishma.jpg'),
      bio: "Expert in digital marketing strategies and search engine optimization to boost online presence.",
      skills: ["SEO", "Google Ads", "Social Media", "Analytics"],
      social: { linkedin: "https://www.linkedin.com/in/karishma-ray/", twitter: "#" }
    },
    {
      name: "Sidha Panda",
      role: "SAP Administrator",
      image: require('../images/Sidha.jpg'),
      bio: "Experienced SAP administrator specializing in system configuration and enterprise solutions.",
      skills: ["SAP ERP", "ABAP", "System Admin", "Database Management"],
      social: { linkedin: "#", github: "#" }
    }
  ];

  const stats = [
    { number: "100+", label: "Projects Completed" },
    { number: "50+", label: "Happy Clients" },
    { number: "6+", label: "Years Experience" },
    { number: "24/7", label: "Support Available" }
  ];

  const values = [
    {
      icon: Rocket,
      title: "Innovation",
      description: "We stay ahead of the curve with cutting-edge technologies and creative solutions."
    },
    {
      icon: Handshake,
      title: "Collaboration",
      description: "We believe in the power of teamwork and building strong partnerships with our clients."
    },
    {
      icon: Gem,
      title: "Quality",
      description: "Every line of code and every design element is crafted with precision and care."
    },
    {
      icon: Target,
      title: "Results",
      description: "We focus on delivering measurable outcomes that drive business growth."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl font-bold mb-6 animate-fade-in-up">About DevInquire</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              We're a passionate team of developers, designers, and innovators dedicated to creating
              exceptional digital experiences that drive business growth and user engagement.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-lg text-gray-600">
                <p>
                  DevInquire was born from a simple idea: to make web development accessible,
                  efficient, and enjoyable for businesses of all sizes.
                </p>
                <p>
                  Founded in 2019, we started as a small team of developers passionate about
                  creating meaningful digital solutions. Today, we've grown into a full-service
                  development agency serving clients worldwide.
                </p>
                <p>
                  Our mission is to bridge the gap between complex technology and business needs,
                  delivering solutions that not only work flawlessly but also drive real results.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <span className="mr-3">✓</span>
                    Expert team with diverse skills
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3">✓</span>
                    Proven track record of success
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3">✓</span>
                    Transparent communication
                  </li>
                  <li className="flex items-center">
                    <span className="mr-3">✓</span>
                    Ongoing support and maintenance
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do and every decision we make.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors duration-300"
              >
                <motion.div
                  className="text-4xl mb-4 flex justify-center"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut"
                  }}
                >
                  <value.icon className="w-12 h-12 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              Our Amazing Team
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Experts</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              The passionate professionals who bring innovation, creativity, and expertise to every project we undertake.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {teamMembers.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100"
              >
                <div className="relative overflow-hidden">
                  <motion.img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-80 object-cover object-top transition-transform duration-500 group-hover:scale-110"
                    whileHover={{ scale: 1.05 }}
                    style={{ objectPosition: 'center top' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

                  {/* Social Links Overlay */}
                  <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                    {Object.entries(member.social).map(([platform, url]) => (
                      <motion.a
                        key={platform}
                        href={url}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:text-blue-600 hover:bg-white transition-all duration-300 shadow-lg"
                        title={platform}
                      >
                        {platform === 'linkedin' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        )}
                        {platform === 'twitter' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                          </svg>
                        )}
                        {platform === 'github' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        )}
                        {platform === 'behance' && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H13.96c.13 3.211 3.483 3.312 4.588 2.029h3.178zm-7.686-4h4.965c-.105-1.547-1.136-2.219-2.477-2.219-1.466 0-2.277.768-2.488 2.219zm-9.574 6.988H0V5.021h6.976c5.476.081 5.58 5.444 2.72 6.906 3.461 1.26 3.577 6.061-3.525 6.061zM3 11h3.584c2.508 0 2.796-3-.312-3H3v3zm3.391 3H3v3.016h3.341c3.055 0 2.868-3.016.05-3.016z" />
                          </svg>
                        )}
                      </motion.a>
                    ))}
                  </div>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="text-center mb-4">
                    <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                      {member.name}
                    </h3>
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 text-sm font-semibold rounded-full mb-3">
                      {member.role}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm lg:text-base leading-relaxed mb-5 text-center">
                    {member.bio}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2">
                    {member.skills.map((skill, skillIndex) => (
                      <motion.span
                        key={skillIndex}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: skillIndex * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 text-xs font-medium rounded-full transition-all duration-300 cursor-default"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Work Together?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Let's discuss your project and see how we can help bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-300"
              >
                Get Started
              </a>
              <a
                href="/services"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-300"
              >
                View Services
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;