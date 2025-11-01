import React from 'react';
import { Link } from 'react-router-dom';
import { Microscope, Mail, Twitter, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    explore: [
      { name: 'Home', href: '/' },
      { name: 'Articles', href: '/blog' },
      { name: 'About', href: '/about' },
      { name: 'Contact', href: '/about' },
    ],
    categories: [
      { name: 'Bacteriology', href: '/blog?category=bacteriology' },
      { name: 'Virology', href: '/blog?category=virology' },
      { name: 'Mycology', href: '/blog?category=mycology' },
      { name: 'Immunology', href: '/blog?category=immunology' },
    ],
    account: [
      { name: 'Login', href: '/login' },
      { name: 'Register', href: '/register' },
      { name: 'Dashboard', href: '/researcher/dashboard' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Code of Conduct', href: '#' },
    ],
  };

  const socialLinks = [
    {
      name: 'Twitter',
      href: '#',
      icon: Twitter,
      label: 'Follow us on Twitter'
    },
    {
      name: 'LinkedIn',
      href: '#',
      icon: Linkedin,
      label: 'Connect on LinkedIn'
    },
    {
      name: 'GitHub',
      href: '#',
      icon: Github,
      label: 'View our GitHub'
    },
    {
      name: 'Email',
      href: '#',
      icon: Mail,
      label: 'Send us an email'
    },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4 group">
              <div className="bg-primary-600 p-2 rounded-lg group-hover:bg-primary-700 transition-colors">
                <Microscope className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                MicroBio
              </span>
            </Link>
            <p className="text-gray-300 mb-6 max-w-md text-sm leading-relaxed">
              A scientific platform dedicated to microbiology research and education. 
              Join our community of researchers, students, and enthusiasts exploring 
              the microscopic world.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                    aria-label={social.label}
                  >
                    <IconComponent className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Explore Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              Explore
            </h3>
            <ul className="space-y-3">
              {footerLinks.explore.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
              Research Areas
            </h3>
            <ul className="space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account & Legal */}
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
                Account
              </h3>
              <ul className="space-y-3">
                {footerLinks.account.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
                Legal
              </h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © {currentYear} MicroBio Research Platform. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center space-x-6 text-sm text-gray-400">
            <span>Made for the scientific community</span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Advancing microbiology research</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;