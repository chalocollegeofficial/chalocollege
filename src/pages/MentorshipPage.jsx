
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, BookOpen, GraduationCap, 
  Send, Sparkles, Star, CheckCircle2, Loader2, Users, 
  Target, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { notifyAdminNewLead } from '@/utils/emailService';
import { 
  validatePhone, validateEmail, validateName, validateCity, 
  validateCourse, handleNumericInput 
} from '@/utils/validation';
import { cn } from '@/lib/utils';
import { useSubmissionLock } from '@/utils/useSubmissionLock';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

const MentorshipPage = () => {
  const pageSeo = STATIC_PAGE_SEO.mentorship;
  const { toast } = useToast();
  const { hasSubmitted: leadLocked, markSubmitted: lockLead, clearLock } = useSubmissionLock('lead-global', 180);
  
  // Form State
  const [formData, setFormData] = useState({
    user_name: '',
    email: '',
    phone_number: '',
    city: '',
    course_of_interest: '',
    preferred_colleges: '',
    message: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const LockedNotice = () => (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-2xl p-6 shadow-sm space-y-2">
      <h3 className="text-lg font-semibold text-slate-900">You already submitted your request.</h3>
      <p className="text-sm text-slate-600">Our team will reach out soon. If you need to update details, unlock below.</p>
      <Button variant="outline" onClick={clearLock}>Submit another request</Button>
    </div>
  );

  // Validation & Handling
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone_number') {
      const val = handleNumericInput(e, 10);
      if (val !== undefined) setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const newErrors = {};
    if (!validateName(formData.user_name)) newErrors.user_name = "Enter a valid name";
    if (!validateEmail(formData.email)) newErrors.email = "Enter a valid email";
    if (!validatePhone(formData.phone_number)) newErrors.phone_number = "Enter valid 10-digit mobile";
    if (!validateCity(formData.city)) newErrors.city = "Enter valid city";
    if (formData.course_of_interest && !validateCourse(formData.course_of_interest)) newErrors.course_of_interest = "Invalid format";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ variant: "destructive", title: "Validation Error", description: "Please fix the highlighted errors." });
      return;
    }

    setIsSubmitting(true);

    try {
      const leadData = {
        ...formData,
        state: formData.city, // Mapping city to state/location for simplicity if state field isn't separate
        page_from: 'Mentorship Page',
        status: 'New',
        want_mentorship: true
      };

      const { data, error } = await supabase.from('leads').insert([leadData]).select();

      if (error) throw error;

      // Trigger Email Notification
      if (data && data.length > 0) {
        notifyAdminNewLead(data[0]);
      }

      toast({
        title: "Request Submitted!",
        description: "A mentor will connect with you shortly.",
        className: "bg-purple-50 border-purple-200 text-purple-900"
      });

      lockLead();

      setFormData({
        user_name: '', email: '', phone_number: '', city: '',
        course_of_interest: '', preferred_colleges: '', message: ''
      });

    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Submission Failed", description: "Please try again later." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-blue-50 font-sans">
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      />

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-6xl">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block py-1 px-4 rounded-full bg-purple-100 text-purple-700 text-sm font-bold tracking-wide mb-2 border border-purple-200 shadow-sm">
            ✨ Premium Guidance Program
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Perfect Mentor</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Connect with alumni from IITs, AIIMS, and top B-Schools. Get a personalized roadmap to crack your dream college.
          </p>
        </motion.div>

        {/* Analytics Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
        >
          {[
            { icon: Users, label: "Mentors Available", value: "500+", color: "text-blue-600", bg: "bg-blue-100" },
            { icon: Target, label: "Students Mentored", value: "10,000+", color: "text-purple-600", bg: "bg-purple-100" },
            { icon: Award, label: "Success Rate", value: "92%", color: "text-emerald-600", bg: "bg-emerald-100" },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white/80 backdrop-blur-md border border-white/50 rounded-2xl p-6 flex items-center gap-4 shadow-lg shadow-purple-500/5 hover:-translate-y-1 transition-transform duration-300">
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main Form Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white/90 backdrop-blur-xl rounded-[30px] shadow-[0_20px_60px_rgba(124,58,237,0.1)] border border-white/60 p-8 md:p-12 relative overflow-hidden">
            
            {/* Background Decorative Blobs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />

            <div className="relative z-10">
              
              {/* Form Header */}
              <div className="flex flex-col md:flex-row items-center md:items-start gap-5 mb-10 text-center md:text-left">
                <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-50 rounded-2xl border border-purple-100 shadow-sm">
                  <GraduationCap className="h-8 w-8 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">Request Mentorship</h2>
                  <p className="text-slate-500 mt-1">Connect with seniors from top colleges for free guidance.</p>
                </div>
              </div>

              {leadLocked ? (
                <LockedNotice />
              ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Your Name</label>
                    <div className="relative group">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <Input 
                        name="user_name"
                        placeholder="Aditya Kumar"
                        value={formData.user_name}
                        onChange={handleChange}
                        className={cn("pl-10 h-12 bg-white/80 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all", errors.user_name && "border-red-500")}
                      />
                    </div>
                    {errors.user_name && <p className="text-xs text-red-500 pl-1">{errors.user_name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Email Address</label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <Input 
                        name="email"
                        type="email"
                        placeholder="aditya@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={cn("pl-10 h-12 bg-white/80 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all", errors.email && "border-red-500")}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-500 pl-1">{errors.email}</p>}
                  </div>

                  {/* Contact */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Contact Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <Input 
                        name="phone_number"
                        placeholder="98765 43210"
                        maxLength={10}
                        value={formData.phone_number}
                        onChange={handleChange}
                        className={cn("pl-10 h-12 bg-white/80 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all", errors.phone_number && "border-red-500")}
                      />
                    </div>
                    {errors.phone_number && <p className="text-xs text-red-500 pl-1">{errors.phone_number}</p>}
                  </div>

                  {/* City/State */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">City / State</label>
                    <div className="relative group">
                      <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <Input 
                        name="city"
                        placeholder="Mumbai, Maharashtra"
                        value={formData.city}
                        onChange={handleChange}
                        className={cn("pl-10 h-12 bg-white/80 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all", errors.city && "border-red-500")}
                      />
                    </div>
                    {errors.city && <p className="text-xs text-red-500 pl-1">{errors.city}</p>}
                  </div>

                  {/* Course */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Target Course</label>
                    <div className="relative group">
                      <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <Input 
                        name="course_of_interest"
                        placeholder="MBA, B.Tech, MBBS..."
                        value={formData.course_of_interest}
                        onChange={handleChange}
                        className={cn("pl-10 h-12 bg-white/80 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all", errors.course_of_interest && "border-red-500")}
                      />
                    </div>
                    {errors.course_of_interest && <p className="text-xs text-red-500 pl-1">{errors.course_of_interest}</p>}
                  </div>

                  {/* Colleges */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Target Colleges</label>
                    <div className="relative group">
                      <GraduationCap className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                      <Input 
                        name="preferred_colleges"
                        placeholder="IIM-A, IIT Bombay..."
                        value={formData.preferred_colleges}
                        onChange={handleChange}
                        className="pl-10 h-12 bg-white/80 border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Your Message / Query</label>
                  <Textarea 
                    name="message"
                    placeholder="Tell us a bit about your background and what help you need..."
                    value={formData.message}
                    onChange={handleChange}
                    className="bg-white/80 border-slate-200 focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 rounded-xl min-h-[100px] resize-none"
                  />
                </div>

                {/* Highlight Cards Row */}
                <div className="grid md:grid-cols-2 gap-4">
                  {/* Yellow Card - Free Guidance */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 hover:shadow-md hover:border-amber-300 transition-all cursor-default select-none">
                    <div className="p-3 rounded-xl bg-amber-400 text-white shadow-sm">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">Free Guidance</h4>
                      <p className="text-xs text-amber-700/80 mt-0.5">100% free mentorship sessions.</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-amber-500 ml-auto" />
                  </div>

                  {/* Green Card - Success Stories */}
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 hover:shadow-md hover:border-emerald-300 transition-all cursor-default select-none">
                    <div className="p-3 rounded-xl bg-emerald-500 text-white shadow-sm">
                      <Star className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">Success Stories</h4>
                      <p className="text-xs text-emerald-700/80 mt-0.5">Join thousands of successful students.</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-lg font-bold rounded-xl shadow-xl shadow-purple-600/30 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-3 group"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : (
                    <>
                      Get a Mentor <span className="p-1 bg-white/20 rounded-full group-hover:bg-white/30 transition-colors"><Send className="h-4 w-4" /></span>
                    </>
                  )}
                </Button>

              </form>
              )}
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default MentorshipPage;
