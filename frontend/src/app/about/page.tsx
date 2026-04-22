"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun, Target, Shield, Users, Brain, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ROUTES } from "@/lib/constants";

export default function AboutPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-input p-2 text-text-muted hover:text-accent transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href={ROUTES.home} className="transition-transform hover:scale-[1.01]">
              <BrandLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="rounded-input p-2 text-text-muted hover:bg-bg hover:text-text-primary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            <Link href={ROUTES.login}>
              <Button variant="outline" className="h-10 px-4 text-sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-16">
        {/* Hero Section */}
        <section className="mx-auto mb-16 max-w-4xl text-center sm:mb-20">
          <div className="mb-6 inline-block rounded-full bg-accent/10 px-4 py-2">
            <p className="text-sm font-semibold text-accent">About WiseRank</p>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl mb-4">
            Transform Your Hiring Process
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
            We're revolutionizing talent acquisition by combining artificial intelligence with human insight to help you build exceptional teams faster and smarter.
          </p>
        </section>

        {/* Mission & Vision */}
        <section className="mx-auto mb-16 max-w-4xl grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Mission */}
          <div className="rounded-card border border-border bg-card p-8 shadow-card hover:shadow-lg transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-input bg-accent/10 mb-4">
              <Target className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Our Mission</h2>
            <p className="text-text-muted leading-relaxed">
              To empower organizations with intelligent recruitment tools that reduce bias, accelerate hiring cycles, and connect them with the best talent for their roles.
            </p>
          </div>

          {/* Vision */}
          <div className="rounded-card border border-border bg-card p-8 shadow-card hover:shadow-lg transition-shadow">
            <div className="flex h-12 w-12 items-center justify-center rounded-input bg-accent/10 mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-3">Our Vision</h2>
            <p className="text-text-muted leading-relaxed">
              A world where organizations access top talent effortlessly and candidates discover roles that truly match their skills and aspirations.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mx-auto mb-16 max-w-4xl">
          <h2 className="text-2xl font-bold text-text-primary mb-8 text-center">Our Core Values</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: Brain,
                title: "Intelligence",
                description: "Leveraging cutting-edge AI and machine learning for smart recruitment decisions.",
              },
              {
                icon: Shield,
                title: "Integrity",
                description: "Maintaining transparency and fairness in every aspect of our platform and operations.",
              },
              {
                icon: Users,
                title: "Collaboration",
                description: "Building partnerships that empower both organizations and talent to succeed together.",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="rounded-card border border-border bg-card p-6 shadow-card hover:border-accent/30 transition-colors text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-input bg-accent/10 mx-auto mb-4">
                  <value.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-bold text-text-primary mb-2">{value.title}</h3>
                <p className="text-sm text-text-muted">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="mx-auto mb-16 max-w-4xl rounded-card border border-border bg-card/50 p-8 sm:p-12">
          <h2 className="text-2xl font-bold text-text-primary mb-8">Why Choose WiseRank?</h2>
          <div className="space-y-4">
            {[
              " Fast & Efficient - Screen hundreds of candidates in minutes",
              " AI-Powered - Advanced algorithms reduce hiring bias",
              " Data-Driven - Get insights that improve hiring outcomes",
              " Secure - Enterprise-grade security and compliance",
              " Easy Integration - Seamless integration with your workflow",
              " Human-Centered - AI augments human judgment, not replaces it",
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 py-2">
                <div className="h-2 w-2 rounded-full bg-accent flex-shrink-0" />
                <p className="text-text-muted">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Ready to Transform Your Hiring?</h2>
          <p className="text-text-muted mb-8">
            Join hundreds of companies already using WiseRank to build better teams.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href={ROUTES.register}>
              <Button className="w-full sm:w-auto">Get Started</Button>
            </Link>
            <Link href={ROUTES.contact}>
              <Button variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
