"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { landingFeatures, landingFAQs, landingSteps, landingTestimonials } from "@/data/platform";

export default function LandingPage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  // Testimonial autoplay
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % landingTestimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Add landing class to body
  useEffect(() => {
    document.body.classList.add("landing");
    return () => document.body.classList.remove("landing");
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-dark)", color: "var(--text-primary)" }}>
      <Navbar />

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden"
        style={{
          padding: "10rem 0 6rem",
          background:
            "radial-gradient(circle 600px at 50% 50%, rgba(245, 158, 11, 0.08), transparent 80%), var(--bg-dark)",
        }}
      >
        <div className="container relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)] px-4 py-2 text-sm font-semibold text-[var(--primary)]">
              ✨ Powered by Advanced AI
            </div>

            <h1
              className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Master Your Future with{" "}
              <span className="text-gradient">Adyapan AI</span>
            </h1>

            <p
              className="mb-10 max-w-2xl text-lg leading-8 md:text-xl"
              style={{ color: "var(--text-secondary)" }}
            >
              Learn, Prepare, Build Your Career, and Get Hired. Adyapan AI is your intelligent
              dashboard companion tracking stats, building resumes, and offering direct career
              coaching.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] px-8 font-semibold text-white shadow-[var(--shadow-glow)] transition-all hover:shadow-[var(--shadow-glow-strong)] hover:-translate-y-1"
              >
                Get Started <ArrowRight size={18} />
              </Link>
              <Link
                href="#features"
                className="glass inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 font-semibold transition-all hover:-translate-y-1"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-28" style={{ background: "var(--bg-dark)" }}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2
              className="mb-4 text-4xl font-extrabold md:text-5xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              AI-Powered Features
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Our tailored algorithms guide you through every stage of your college and career
              journey.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {landingFeatures.map((feature, i) => (
              <div
                key={i}
                className="glass flex flex-col p-8 transition-all hover:-translate-y-2 hover:scale-[1.02] hover:border-[rgba(245,158,11,0.3)] hover:shadow-[0_15px_35px_rgba(245,158,11,0.15)]"
              >
                <div className="mb-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
                  {/* Icon placeholder */}
                  <div
                    className="h-10 w-10 rounded-md"
                    style={{ background: "var(--gradient-main)", opacity: 0.7 }}
                  />
                </div>
                <h3
                  className="mb-4 text-2xl font-bold"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {feature.title}
                </h3>
                <p className="mb-6 flex-grow text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.description}
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] transition-colors hover:text-[var(--text-primary)]"
                >
                  Explore Tool <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-28" style={{ background: "var(--bg-dark)" }}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2
              className="mb-4 text-4xl font-extrabold md:text-5xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Your Journey with Adyapan AI
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              A simple step-by-step pathway to supercharge your skills and land your dream job.
            </p>
          </div>

          <div className="relative mx-auto max-w-4xl">
            {/* Timeline connector */}
            <div
              className="absolute left-1/2 hidden h-full w-0.5 -translate-x-1/2 lg:block"
              style={{
                background: "linear-gradient(to bottom, var(--primary), var(--primary-dark))",
              }}
            />

            {landingSteps.map((step, i) => (
              <div
                key={i}
                className={`relative mb-16 flex items-center ${
                  i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                } flex-col gap-8 lg:gap-12`}
              >
                {/* Dot indicator */}
                <div
                  className="absolute left-1/2 hidden h-6 w-6 -translate-x-1/2 rounded-full border-4 border-[var(--primary-dark)] bg-[var(--bg-dark)] shadow-[0_0_10px_var(--primary-dark)] lg:block"
                  style={{ zIndex: 10 }}
                />

                {/* Content card */}
                <div
                  className={`glass w-full p-8 ${
                    i % 2 === 0 ? "lg:text-right" : "lg:text-left"
                  } lg:w-5/12`}
                >
                  <div
                    className="mb-2 text-sm font-bold"
                    style={{ color: "var(--primary)" }}
                  >
                    {step.step}
                  </div>
                  <h3
                    className="mb-3 text-2xl font-bold"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {step.description}
                  </p>
                </div>

                {/* Spacer for flex layout */}
                <div className="hidden lg:block lg:w-5/12" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-28" style={{ background: "var(--bg-dark)" }}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2
              className="mb-4 text-4xl font-extrabold md:text-5xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              What Users Say
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Hear from users who boosted their GPA, structured their portfolios, and secured roles.
            </p>
          </div>

          <div className="glass relative mx-auto max-w-4xl overflow-hidden p-0">
            <div
              className="testimonial-wrapper"
              style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
            >
              {landingTestimonials.map((testimonial, i) => (
                <div key={i} className="testimonial-slide p-12 text-center">
                  <p className="mb-8 text-2xl italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="mx-auto mb-4 h-16 w-16 overflow-hidden rounded-full border-2 border-[var(--primary)]">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.author}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h4 className="text-lg font-bold" style={{ fontFamily: "'Outfit', sans-serif" }}>
                    {testimonial.author}
                  </h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {testimonial.role}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-2 pb-8">
              {landingTestimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`h-2.5 rounded-full transition-all ${
                    i === currentTestimonial
                      ? "w-6 bg-[var(--primary)]"
                      : "w-2.5 bg-[var(--border-color)]"
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-28" style={{ background: "var(--bg-dark)" }}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2
              className="mb-4 text-4xl font-extrabold md:text-5xl"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Find answers to common questions about our platform and AI capabilities.
            </p>
          </div>

          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {landingFAQs.map((faq, i) => (
              <div key={i} className="glass overflow-hidden">
                <button
                  onClick={() => setActiveFAQ(activeFAQ === i ? null : i)}
                  className="flex w-full items-center justify-between p-6 text-left"
                >
                  <span
                    className="text-lg font-semibold"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {faq.question}
                  </span>
                  <span
                    className={`text-lg transition-transform ${
                      activeFAQ === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <div className={`faq-answer ${activeFAQ === i ? "open" : ""}`}>
                  <div className="px-6 pb-6 pt-0 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
