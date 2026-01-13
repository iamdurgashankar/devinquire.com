import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Target, Handshake, Gem } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { Section, AnimatedSection, AnimatedSectionTitle, Grid, AnimatedCard, AnimatedStatCard } from '../components/shared';
import SEO from '../components/SEO';
import { responsiveTypography, responsiveSpacing, responsiveContainers } from '../utils/responsive';

const About = () => {



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
    }
  ];

  return (
    <>
      <SEO 
        title="About DevInquire - Expert Development Team"
        description="Learn about DevInquire's passionate team of developers, designers, and digital strategists. Discover our mission, values, and commitment to delivering exceptional digital solutions for businesses worldwide."
        keywords="about DevInquire, development team, web developers, digital strategists, software development company, professional team, technology experts"
        canonical="https://devinquire.com/about"
        ogTitle="About DevInquire - Meet Our Expert Development Team"
        ogDescription="Passionate team of developers and designers committed to transforming ideas into powerful digital solutions. Learn about our mission and values."
        ogUrl="https://devinquire.com/about"
      />
      <PageLayout
        title="About DevInquire"
        subtitle="We're a passionate team of developers, designers, and innovators dedicated to creating exceptional digital experiences that drive business growth and user engagement."
      >

      {/* Stats Section */}
      <Section spacing="large" className="bg-white">
        <Grid cols={4}>
          {stats.map((stat, index) => (
            <AnimatedStatCard
              key={index}
              number={stat.number}
              label={stat.label}
              delay={index * 0.1}
            />
          ))}
        </Grid>
      </Section>

      {/* Story Section */}
      <section className={`${responsiveSpacing.sectionPadding} bg-gray-50`}>
        <div className={responsiveContainers.standard}>
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className={`${responsiveTypography.sectionTitle} text-gray-900 mb-6`}>Our Story</h2>
              <div className={`space-y-4 ${responsiveTypography.bodyLarge} text-gray-600`}>
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
              <div className="bg-[#0077b6] rounded-2xl p-8 text-white">
                <h3 className={`${responsiveTypography.cardTitle} font-bold mb-4`}>Why Choose Us?</h3>
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
      <Section spacing="large" className="bg-white">
        <AnimatedSectionTitle
          title="Our Values"
          subtitle="The principles that guide everything we do and every decision we make."
        />

        <Grid cols={3}>
          {values.map((value, index) => (
            <AnimatedCard
              key={index}
              delay={index * 0.1}
              className="text-center bg-gray-50 hover:bg-blue-50 transition-colors duration-300 min-h-[280px] flex flex-col justify-start"
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
              <h3 className={`${responsiveTypography.cardTitle} text-gray-900 mb-3`}>{value.title}</h3>
              <p className={`${responsiveTypography.bodyBase} text-gray-600 flex-grow`}>{value.description}</p>
            </AnimatedCard>
          ))}
        </Grid>
      </Section>



      {/* CTA Section */}
      <section className={`${responsiveSpacing.sectionPadding} bg-[#0077b6] relative overflow-hidden`} style={{minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0077b6 0%, #005a8a 100%)', boxShadow: '0 20px 40px rgba(0, 119, 182, 0.3)', borderRadius: '20px', margin: '40px auto', maxWidth: '1200px'}}>
        <div className={`${responsiveContainers.narrow} text-center`}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={`${responsiveTypography.sectionTitle} text-white mb-6`}>
              Ready to Work Together?
            </h2>
            <p className={`${responsiveTypography.sectionSubtitle} text-blue-100 mb-8`}>
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
      </PageLayout>
    </>
  );
};

export default About;