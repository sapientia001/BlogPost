import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import passport from '../../../assets/Passport.jpg'
import { 
  Microscope, 
  GraduationCap, 
  BookOpen, 
  Target,
  Globe,
  Heart,
  User,
  MapPin,
  Code,
  Database,
  TestTube,
  Beaker,
  X,
  Mail,
  Phone
} from 'lucide-react';

const About = () => {
  const [showContactPopup, setShowContactPopup] = useState(false);

  const personalInfo = {
    name: "Eyamah Sylvester",
    title: "Microbiologist & Technology Educator",
    location: "Moscow, Russia",
    specialization: "Medical Microbiology & Health Technology",
    email: "ubiquitous.micro@gmail.com",
    phone: "+44 7508 619654 (WhatApp)"
  };

  const medicalBackground = [
    {
      institution: "First Moscow State Medical University",
      focus: "Public Health & Medical Research",
      period: "2023 - 2025",
      icon: GraduationCap
    },
    {
      institution: "Nasarawa State University",
      focus: "Microbiology & Laboratory Sciences",
      period: "2015 - 2019",
      icon: Microscope
    }
  ];

  const medicalExpertise = [
    {
      area: "Clinical Laboratory Analysis",
      techniques: ["Widal Test", "Blood Group Analysis", "Infectious Disease Strip Testing"],
      icon: TestTube
    },
    {
      area: "Medical Microbiology",
      applications: ["HBV Detection", "H. Pylori Testing", "Pathogen Identification"],
      icon: Beaker
    },
    {
      area: "Public Health",
      focus: ["Disease Prevention", "Health Education", "Community Health Initiatives"],
      icon: Heart
    }
  ];

  const programmingSkills = {
    frontend: ["HTML", "CSS", "JavaScript"],
    backend: ["Node.js", "Python"],
    dataScience: ["R", "Data Analysis", "Statistical Computing"],
    applications: [
      "Laboratory Data Management Systems",
      "Health Data Analysis",
      "Educational Technology Platforms",
      "Research Data Visualization"
    ]
  };

  const professionalSkills = [
    "Team Building & Leadership",
    "Scientific Decision Making",
    "Research Methodology",
    "Educational Program Development",
    "Laboratory Quality Control"
  ];

  const blogVision = {
    mission: "Bridging microbiology and technology to advance healthcare solutions through innovative research and education.",
    objectives: [
      "Integrate programming skills with microbiological research",
      "Develop digital tools for laboratory data analysis",
      "Create educational platforms for microbiology students",
      "Advance public health through technology-driven solutions"
    ],
    focusAreas: [
      "Medical Laboratory Automation",
      "Health Data Science",
      "Educational Technology in Sciences",
      "Digital Health Solutions"
    ]
  };

  const ContactPopup = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={() => setShowContactPopup(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Get In Touch</h3>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Email</p>
              <p className="text-gray-900">{personalInfo.email}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Phone className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-600 font-medium">Phone</p>
              <p className="text-gray-900">{personalInfo.phone}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Feel free to reach out for collaborations, questions, or discussions about microbiology and technology.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {showContactPopup && <ContactPopup />}
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-white bg-opacity-20 p-2">
                  <img 
                    src={passport} 
                    alt="Eyamah Sylvester"
                    className="w-full h-full rounded-full object-cover border-4 border-white border-opacity-20"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary-600 p-2 rounded-full">
                  <Microscope className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {personalInfo.name}
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-6">
              {personalInfo.title}
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 text-primary-100">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>{personalInfo.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>{personalInfo.specialization}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Summary */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Professional Vision</h2>
            <div className="bg-primary-50 rounded-2xl p-8 max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 leading-relaxed">
                "Dedicated to advancing healthcare through the integration of microbiology expertise 
                with modern programming technologies. Passionate about developing innovative solutions 
                that bridge laboratory science with digital health applications."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Medical Education & Expertise */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Medical Background</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {medicalBackground.map((edu, index) => {
              const IconComponent = edu.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-primary-100 p-3 rounded-full mr-4">
                      <IconComponent className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{edu.institution}</h3>
                      <p className="text-primary-600">{edu.period}</p>
                    </div>
                  </div>
                  <p className="text-gray-600">{edu.focus}</p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {medicalExpertise.map((expertise, index) => {
              const IconComponent = expertise.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{expertise.area}</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {expertise.techniques?.map((tech, techIndex) => (
                      <li key={techIndex}>• {tech}</li>
                    ))}
                    {expertise.applications?.map((app, appIndex) => (
                      <li key={appIndex}>• {app}</li>
                    ))}
                    {expertise.focus?.map((focus, focusIndex) => (
                      <li key={focusIndex}>• {focus}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Programming Skills */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Technology Stack</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Programming Languages */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <Code className="h-8 w-8 text-primary-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Programming & Development</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Frontend Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {programmingSkills.frontend.map((skill, index) => (
                      <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Backend & Data Science</h4>
                  <div className="flex flex-wrap gap-2">
                    {programmingSkills.backend.map((skill, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                    {programmingSkills.dataScience.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Applications */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center mb-6">
                <Database className="h-8 w-8 text-primary-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">Technical Applications</h3>
              </div>
              
              <ul className="space-y-3">
                {programmingSkills.applications.map((application, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <div className="bg-primary-100 p-1 rounded-full mt-1 flex-shrink-0">
                      <Target className="h-4 w-4 text-primary-600" />
                    </div>
                    <span className="text-gray-700">{application}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Vision */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Microbiology Blog Vision</h2>
            <p className="text-xl text-primary-100 max-w-3xl mx-auto">
              {blogVision.mission}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Core Objectives</h3>
              <ul className="space-y-3">
                {blogVision.objectives.map((objective, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-primary-200 mt-1 flex-shrink-0" />
                    <span className="text-primary-100">{objective}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white bg-opacity-10 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Focus Areas</h3>
              <ul className="space-y-3">
                {blogVision.focusAreas.map((area, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-primary-200 mt-1 flex-shrink-0" />
                    <span className="text-primary-100">{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Skills */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Professional Competencies</h2>
          
          <div className="flex flex-wrap justify-center gap-3">
            {professionalSkills.map((skill, index) => (
              <span key={index} className="bg-gray-100 text-gray-800 px-4 py-2 rounded-full font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Explore the Future of Microbiology & Technology</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join me in exploring innovative solutions at the intersection of medical science and digital technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/blog"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Read the Blog
            </Link>
            <button
              onClick={() => setShowContactPopup(true)}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Get in Touch
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;