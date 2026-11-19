import React from "react";
import { motion } from "framer-motion";
import { Rocket, Handshake, Gem, CheckCircle2 } from "lucide-react";
import PageLayout from "../components/PageLayout";
import ModernCTA from "../components/ModernCTA";
import {
  Section,
  AnimatedSectionTitle,
  Grid,
  AnimatedStatCard,
} from "../components/shared";
import SEO from "../components/SEO";
import {
  responsiveTypography,
  responsiveSpacing,
  responsiveContainers,
} from "../utils/responsive";

const About = () => {
  const stats = [
    { number: "100+", label: "Projects Completed" },
    { number: "50+", label: "Happy Clients" },
    { number: "6+", label: "Years Experience" },
    { number: "24/7", label: "Support Available" },
  ];

  const values = [
    {
      icon: Rocket,
      tint: "from-[#6B63F2] to-[#4e45e1]",
      title: "Innovation First",
      description:
        "We stay ahead of the curve with modern cloud architectures, AI-native workflows, and human-centric engineering.",
    },
    {
      icon: Handshake,
      tint: "from-[#6B63F2] to-[#4139BF]",
      title: "Deep Collaboration",
      description:
        "We partner closely with founders and enterprise leaders, ensuring transparent milestones and shared ownership.",
    },
    {
      icon: Gem,
      tint: "from-[#6B63F2] to-[#4e45e1]",
      title: "Apple-Grade Craft",
      description:
        "Every line of code and every interface interaction is engineered with obsessive attention to detail and performance.",
    },
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
        badge="Our Studio"
        title="About DevInquire"
        subtitle="A multidisciplinary studio of engineers, interface designers, and systems architects crafting effortless digital products."
      >
        {/* Stats Section */}
        <Section spacing="small" className="!pt-4 !pb-8">
          <Grid cols={4}>
            {stats.map((stat, index) => (
              <AnimatedStatCard
                key={index}
                number={stat.number}
                label={stat.label}
                delay={index * 0.08}
              />
            ))}
          </Grid>
        </Section>

        {/* Story Section */}
        <section className={responsiveSpacing.sectionPadding}>
          <div className={responsiveContainers.standard}>
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7 apple-card p-8 sm:p-10"
              >
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-blue)]">
                  Origin & Mission
                </span>
                <h2
                  className={`${responsiveTypography.sectionTitle} tracking-[-0.025em] text-[var(--apple-text-primary)] mt-1 mb-6`}
                >
                  Our Story
                </h2>
                <div className="space-y-4 text-[15px] sm:text-[16px] text-[var(--apple-text-secondary)] leading-relaxed">
                  <p>
                    DevInquire was born from a clear conviction: enterprise software and web applications should possess the same clarity, responsiveness, and elegance as the finest consumer hardware.
                  </p>
                  <p>
                    Founded in 2019, we began as a focused collective of full-stack engineers passionate about solving hard architectural challenges. Today, we serve startups and established enterprises worldwide across web, mobile, and AI ecosystems.
                  </p>
                  <p>
                    Our mission is to bridge complex engineering with intuitive human interface design—delivering products that ship fast and scale effortlessly.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-5 apple-card p-8 sm:p-10 relative overflow-hidden"
              >
                <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#4e45e1]/15 rounded-full blur-3xl pointer-events-none" />
                <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--apple-purple)]">
                  The DevInquire Standard
                </span>
                <h3 className="text-2xl font-bold text-[var(--apple-text-primary)] mt-1 mb-6">
                  Why Teams Choose Us
                </h3>
                <ul className="space-y-4">
                  {[
                    "Senior engineering team with full-stack & AI mastery",
                    "Proven track record across 100+ production launches",
                    "Transparent sprint velocity and real-time client portal",
                    "24/7 post-launch reliability and performance tuning",
                  ].map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-[14px] text-[var(--apple-text-secondary)]"
                    >
                      <CheckCircle2 className="w-5 h-5 text-[#28CD41] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <Section spacing="large">
          <AnimatedSectionTitle
            title="Core Principles"
            subtitle="The engineering and design values that guide every product we ship."
          />

          <Grid cols={3}>
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="apple-card apple-card-interactive p-8 flex flex-col"
              >
                <div
                  className={`w-12 h-12 rounded-[14px] bg-gradient-to-b ${value.tint} flex items-center justify-center shadow-md mb-6`}
                >
                  <value.icon className="w-6 h-6 text-white badge-white" />
                </div>
                <h3 className="text-xl font-bold text-[var(--apple-text-primary)] mb-3">
                  {value.title}
                </h3>
                <p className="text-[14px] text-[var(--apple-text-secondary)] leading-relaxed flex-grow">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </Grid>
        </Section>

        <ModernCTA
          title="Ready to Work Together?"
          subtitle="Let's discuss your project and see how we can help bring your vision to life."
          primaryText="Get Started Now"
          primaryLink="/contact"
          secondaryText="Our Services"
          secondaryLink="/services"
        />
      </PageLayout>
    </>
  );
};

export default About;
