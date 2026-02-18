import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react'; // Removed GraduationCap as it's replaced by an image

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              {/* New Logo Image */}
              <img 
                src="/nobglogo.png" 
                alt="Aao College Logo" 
                className="h-12 w-12 object-contain" 
              />
              {/* Branded Title */}
              <span className="text-xl font-bold">
                <span className="text-blue-400">Aao</span>
                <span className="text-green-400">College</span>
              </span>
            </div>
            <p className="text-gray-400 mb-4">
              Your trusted partner in finding the perfect college and achieving your educational dreams.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/people/Aao-College/61583548201621/" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors" target='blank'>
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://x.com/Aao_college?s=21" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors" target='blank'>
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://www.instagram.com/aao_college/?igsh=MTJsc252aHQ3ZDRmbA%3D%3D#" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors" target='blank'>
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/in/chalo-college-b54527398/" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors" target='blank'>
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@aaocollege" className="bg-gray-800 p-2 rounded-lg hover:bg-blue-600 transition-colors" target='blank'>
                <Youtube className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Quick Links</span>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/services" className="text-gray-400 hover:text-blue-400 transition-colors">Services</Link></li>
              <li><Link to="/colleges" className="text-gray-400 hover:text-blue-400 transition-colors">Colleges</Link></li>
              <li><Link to="/blog" className="text-gray-400 hover:text-blue-400 transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Services</span>
            <ul className="space-y-2">
              <li><Link to="/services/college-search" className="text-gray-400">College Search</Link></li>
              <li><Link to="/services/admission-consulting" className="text-gray-400">Admission Consulting</Link></li>
              <li><Link to="/services/course-counseling" className="text-gray-400">Course Counseling</Link></li>
              <li><Link to="/services/scholarship-guidance" className="text-gray-400" >Scholarship Guidance</Link></li>
              <li><Link to="/services/entrance-exam-prep" className="text-gray-400">Entrance Exam Prep</Link></li>
            </ul>
          </div>

          <div>
            <span className="text-lg font-semibold mb-4 block">Contact Us</span>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400">info@aaocollege.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400">+91 7065657041 /45</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="h-5 w-5 text-blue-400 mt-1 flex-shrink-0" />
                <span className="text-gray-400">Greater Noida, uttar pradesh, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2025 Aao College. All rights reserved || © Design & Developed by sofra consultancy services.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
