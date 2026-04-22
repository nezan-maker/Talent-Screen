"use client";

import Link from "next/link";
import { ArrowLeft, Zap, Moon, Sun, Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/theme/ThemeProvider";
import { ROUTES } from "@/lib/constants";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ContactPage() {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof formData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof typeof formData, boolean>>>({});

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters";
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: keyof typeof formData) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (touched[field]) {
      validate(field, value);
    }
  };

  const validate = (field: keyof typeof formData, value: string) => {
    const newErrors = { ...errors };
    switch (field) {
      case "name":
        if (!value.trim()) {
          newErrors.name = "Full name is required";
        } else if (value.trim().length < 2) {
          newErrors.name = "Name must be at least 2 characters";
        } else {
          delete newErrors.name;
        }
        break;
      case "email":
        if (!value.trim()) {
          newErrors.email = "Email is required";
        } else if (!isValidEmail(value)) {
          newErrors.email = "Please enter a valid email";
        } else {
          delete newErrors.email;
        }
        break;
      case "subject":
        if (!value.trim()) {
          newErrors.subject = "Subject is required";
        } else if (value.trim().length < 3) {
          newErrors.subject = "Subject must be at least 3 characters";
        } else {
          delete newErrors.subject;
        }
        break;
      case "message":
        if (!value.trim()) {
          newErrors.message = "Message is required";
        } else if (value.trim().length < 10) {
          newErrors.message = "Message must be at least 10 characters";
        } else {
          delete newErrors.message;
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors above.");
      return;
    }
    setLoading(true);
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTouched({});
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-input p-2 text-text-muted hover:text-text-primary transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Link href={ROUTES.home} className="flex items-center gap-2 font-bold text-text-primary">
              <span className="flex h-9 w-9 items-center justify-center rounded-input bg-accent text-white shadow-sm">
                <Zap className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline">RankWise</span>
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

      <main>
        {/* Hero Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <div className="mb-6 inline-block rounded-full bg-accent/10 px-4 py-2">
              <p className="text-sm font-semibold text-accent">Contact Us</p>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl mb-4">
              Get in Touch
            </h1>
            <p className="mt-6 text-lg text-text-muted max-w-2xl mx-auto leading-relaxed">
              Have a question or want to learn more about RankWise? We'd love to hear from you. Our team is ready to help.
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {/* Contact Info */}
              <div className="lg:col-span-1">
                <div className="space-y-12">
                  {[
                    {
                      icon: Mail,
                      title: "Email",
                      value: "hello@rankwise.io",
                      href: "mailto:hello@rankwise.io",
                      description: "Send us an email at any time",
                    },
                    {
                      icon: Phone,
                      title: "Phone",
                      value: "+1 (555) 123-4567",
                      href: "tel:+15551234567",
                      description: "Call us during business hours",
                    },
                    {
                      icon: MapPin,
                      title: "Location",
                      value: "San Francisco, CA",
                      href: "",
                      description: "Visit our headquarters",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-input bg-accent/10 text-accent flex-shrink-0">
                        <item.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary mb-1">{item.title}</h3>
                        <p className="text-sm text-text-muted mb-2">{item.description}</p>
                        {item.href ? (
                          <a href={item.href} className="text-accent font-medium hover:text-accent hover:underline transition-colors">
                            {item.value}
                          </a>
                        ) : (
                          <p className="text-text-muted font-medium">{item.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="rounded-card border border-border bg-card p-8 shadow-card sm:p-10">
                  <h2 className="text-xl font-bold text-text-primary mb-6">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-text-primary mb-3">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={(e) => handleChange("name", e.target.value)}
                          onBlur={() => handleBlur("name")}
                          className={`w-full rounded-input border bg-bg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
                            errors.name && touched.name
                              ? "border-danger focus:border-danger focus:ring-danger/20"
                              : "border-border focus:border-accent focus:ring-accent/20"
                          }`}
                          placeholder="John Doe"
                        />
                        {errors.name && touched.name && (
                          <p className="text-xs font-medium text-danger mt-1.5">{errors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-3">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          onBlur={() => handleBlur("email")}
                          className={`w-full rounded-input border bg-bg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
                            errors.email && touched.email
                              ? "border-danger focus:border-danger focus:ring-danger/20"
                              : "border-border focus:border-accent focus:ring-accent/20"
                          }`}
                          placeholder="john@example.com"
                        />
                        {errors.email && touched.email && (
                          <p className="text-xs font-medium text-danger mt-1.5">{errors.email}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="subject" className="block text-sm font-semibold text-text-primary mb-3">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={(e) => handleChange("subject", e.target.value)}
                        onBlur={() => handleBlur("subject")}
                        className={`w-full rounded-input border bg-bg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all ${
                          errors.subject && touched.subject
                            ? "border-danger focus:border-danger focus:ring-danger/20"
                            : "border-border focus:border-accent focus:ring-accent/20"
                        }`}
                        placeholder="How can we help?"
                      />
                      {errors.subject && touched.subject && (
                        <p className="text-xs font-medium text-danger mt-1.5">{errors.subject}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-semibold text-text-primary mb-3">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={(e) => handleChange("message", e.target.value)}
                        onBlur={() => handleBlur("message")}
                        rows={6}
                        className={`w-full rounded-input border bg-bg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 transition-all resize-none ${
                          errors.message && touched.message
                            ? "border-danger focus:border-danger focus:ring-danger/20"
                            : "border-border focus:border-accent focus:ring-accent/20"
                        }`}
                        placeholder="Tell us more about your inquiry..."
                      />
                      {errors.message && touched.message && (
                        <p className="text-xs font-medium text-danger mt-1.5">{errors.message}</p>
                      )}
                    </div>

                    <Button type="submit" disabled={loading || Object.keys(errors).length > 0} size="lg" className="w-full font-semibold">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-border py-16 sm:py-20 mt-12 bg-accent/5">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-4">Prefer to see a demo first?</h2>
            <p className="text-text-muted mb-8 max-w-2xl mx-auto leading-relaxed">
              Create a free account and explore RankWise directly. Get started in just a few minutes.
            </p>
            <Link href={ROUTES.register}>
              <Button size="lg">Get Started Now</Button>
            </Link>
          </div>
        </section>

        {/* Quick Links Section */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <h2 className="text-xl font-bold text-text-primary mb-8 text-center">Other Resources</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <Link href="/about">
                <div className="rounded-card border border-border bg-card p-6 text-center hover:border-accent/30 transition-colors cursor-pointer">
                  <h3 className="font-semibold text-text-primary mb-2">Learn About Us</h3>
                  <p className="text-sm text-text-muted">Discover our mission and values</p>
                </div>
              </Link>
              <Link href="/">
                <div className="rounded-card border border-border bg-card p-6 text-center hover:border-accent/30 transition-colors cursor-pointer">
                  <h3 className="font-semibold text-text-primary mb-2">See Features</h3>
                  <p className="text-sm text-text-muted">Explore what RankWise can do</p>
                </div>
              </Link>
              <Link href={ROUTES.login}>
                <div className="rounded-card border border-border bg-card p-6 text-center hover:border-accent/30 transition-colors cursor-pointer">
                  <h3 className="font-semibold text-text-primary mb-2">Sign In</h3>
                  <p className="text-sm text-text-muted">Access your account</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-text-muted sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} RankWise · Demo frontend</p>
          <div className="flex gap-6">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Home
            </Link>
            <Link href="/about" className="hover:text-text-primary transition-colors">
              About
            </Link>
            <Link href="/contact" className="hover:text-text-primary transition-colors">
              Contact
            </Link>
            <Link href={ROUTES.login} className="hover:text-text-primary transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
