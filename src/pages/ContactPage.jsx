
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, MapPin, BookOpen, GraduationCap, 
  Percent, Trophy, Send, Sparkles, IndianRupee, 
  Clock, CheckCircle2, Loader2, ArrowRight, MessageSquare 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { notifyAdminNewLead } from '@/utils/emailService';
import { 
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { useSubmissionLock } from '@/utils/useSubmissionLock';
import { 
  validatePhone, validateEmail, validateName, validateCity, 
  validateCourse, handleNumericInput 
} from '@/utils/validation';
import { cn } from '@/lib/utils';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

const ContactPage = () => {
  const pageSeo = STATIC_PAGE_SEO.contact;
  const { toast } = useToast();
  const { hasSubmitted: leadLocked, markSubmitted: lockLead, clearLock } = useSubmissionLock('lead-global', 180);
  
  // --- Main Enquiry Form State ---
  const [mainForm, setMainForm] = useState({
    user_name: '',
    mobile: '',
    email: '',
    city: '',
    course_of_interest: '',
    state: '',
    preferred_colleges: '',
    percentage_12th: '',
    entrance_exam: '',
    exam_score: '',
    want_mentorship: false,
    want_loan_assistance: false
  });
  const [mainErrors, setMainErrors] = useState({});
  const [isMainSubmitting, setIsMainSubmitting] = useState(false);

  // --- Secondary Mentorship Form State ---
  const [mentorForm, setMentorForm] = useState({
    name: '',
    email: '',
    contact: '',
    location: '',
    course: '',
    colleges: '',
    message: ''
  });
  const [mentorErrors, setMentorErrors] = useState({});
  const [isMentorSubmitting, setIsMentorSubmitting] = useState(false);

  // --- Booking Modal State ---
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    email: '',
    mobile: '',
    date: '',
    time: ''
  });

  const LockedNotice = ({ title, subtitle }) => (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-2xl p-6 shadow-sm space-y-2">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="text-sm text-slate-600">{subtitle || 'A counselor is already on the way. If you need to update details, you can unlock the form below.'}</p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button variant="outline" onClick={clearLock}>Submit another enquiry</Button>
      </div>
    </div>
  );

  // --- Handlers for Main Form ---
  const handleMainChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile' || name === 'percentage_12th') {
      if (name === 'mobile') {
         const val = handleNumericInput(e, 10);
         if (val !== undefined) setMainForm(prev => ({ ...prev, [name]: val }));
      } else {
         setMainForm(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setMainForm(prev => ({ ...prev, [name]: value }));
    }
    if (mainErrors[name]) setMainErrors(prev => ({ ...prev, [name]: null }));
  };

  const toggleMainOption = (key) => {
    setMainForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const submitMainForm = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!validateName(mainForm.user_name)) errors.user_name = "Enter valid full name";
    if (!validatePhone(mainForm.mobile)) errors.mobile = "Enter valid 10-digit mobile";
    if (!validateEmail(mainForm.email)) errors.email = "Enter valid email address";
    if (!validateCity(mainForm.city)) errors.city = "Enter valid city";
    if (mainForm.course_of_interest && !validateCourse(mainForm.course_of_interest)) errors.course_of_interest = "Invalid course format";
    
    if (Object.keys(errors).length > 0) {
      setMainErrors(errors);
      toast({ variant: "destructive", title: "Please fix errors", description: "Check highlighted fields." });
      return;
    }

    setIsMainSubmitting(true);
    try {
      const leadData = {
        user_name: mainForm.user_name,
        phone_number: mainForm.mobile,
        email: mainForm.email,
        city: mainForm.city,
        state: mainForm.state,
        course_of_interest: mainForm.course_of_interest,
        preferred_colleges: mainForm.preferred_colleges,
        percentage_12th: mainForm.percentage_12th,
        entrance_exam: mainForm.entrance_exam,
        exam_score: mainForm.exam_score,
        want_mentorship: mainForm.want_mentorship,
        want_loan_assistance: mainForm.want_loan_assistance,
        page_from: 'Admission Enquiry',
        status: 'New'
      };

      const { data, error } = await supabase.from('leads').insert([leadData]).select();

      if (error) throw error;

      // Notify Admin immediately via Email
      if (data && data.length > 0) {
        notifyAdminNewLead(data[0]);
      }

      toast({ 
        title: "Lead submitted successfully", 
        description: "Our counselors will guide you to your dream college.",
        className: "bg-green-50 border-green-200 text-green-900"
      });
      
      lockLead();
      
      setMainForm({
        user_name: '', mobile: '', email: '', city: '', course_of_interest: '',
        state: '', preferred_colleges: '', percentage_12th: '', entrance_exam: '',
        exam_score: '', want_mentorship: false, want_loan_assistance: false
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to submit enquiry." });
    } finally {
      setIsMainSubmitting(false);
    }
  };

  // --- Handlers for Mentorship Form ---
  const handleMentorChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contact') {
      const val = handleNumericInput(e, 10);
      if (val !== undefined) setMentorForm(prev => ({ ...prev, [name]: val }));
    } else {
      setMentorForm(prev => ({ ...prev, [name]: value }));
    }
    if (mentorErrors[name]) setMentorErrors(prev => ({ ...prev, [name]: null }));
  };

  const submitMentorForm = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!validateName(mentorForm.name)) errors.name = "Enter valid name";
    if (!validatePhone(mentorForm.contact)) errors.contact = "Enter valid mobile";
    if (!validateEmail(mentorForm.email)) errors.email = "Enter valid email";

    if (Object.keys(errors).length > 0) {
      setMentorErrors(errors);
      return;
    }

    setIsMentorSubmitting(true);
    try {
      const leadData = {
        user_name: mentorForm.name,
        email: mentorForm.email,
        phone_number: mentorForm.contact,
        city: mentorForm.location,
        course_of_interest: mentorForm.course,
        preferred_colleges: mentorForm.colleges,
        message: mentorForm.message,
        want_mentorship: true, 
        page_from: 'Mentorship Request',
        status: 'New'
      };

      const { data, error } = await supabase.from('leads').insert([leadData]).select();

      if (error) throw error;

      // Notify Admin immediately via Email
      if (data && data.length > 0) {
        notifyAdminNewLead(data[0]);
      }

      toast({ 
        title: "Lead submitted successfully", 
        description: "A mentor will connect with you shortly.",
        className: "bg-green-50 border-green-200 text-green-900"
      });
      lockLead();
      setMentorForm({ name: '', email: '', contact: '', location: '', course: '', colleges: '', message: '' });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Submission failed." });
    } finally {
      setIsMentorSubmitting(false);
    }
  };

  // --- Handlers for Booking Modal ---
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsBookingSubmitting(true);
    try {
      // 1. Save to counseling_bookings
      const { error } = await supabase.from('counseling_bookings').insert([{
        name: bookingForm.name,
        email: bookingForm.email,
        mobile: bookingForm.mobile,
        preferred_date: bookingForm.date,
        preferred_time: bookingForm.time,
        status: 'pending'
      }]);

      if (error) throw error;
      
      // 2. Also save to leads for centralized management & notifications
      const leadData = {
        user_name: bookingForm.name,
        email: bookingForm.email,
        phone_number: bookingForm.mobile,
        city: 'Booking Request',
        course_of_interest: 'Counseling Call',
        page_from: 'Booking Modal',
        message: `Date: ${bookingForm.date}, Time: ${bookingForm.time}`,
        status: 'New'
      };
      
      const { data: leadDataResponse, error: leadError } = await supabase.from('leads').insert([leadData]).select();
      
      // 3. Notify Admin
      if (leadDataResponse && leadDataResponse.length > 0) {
        notifyAdminNewLead(leadDataResponse[0]);
      }

      toast({ 
        title: "Lead submitted successfully", 
        description: "We have scheduled your call.",
        className: "bg-green-50 border-green-200 text-green-900" 
      });
      
      lockLead();
      
      setIsBookingOpen(false);
      setBookingForm({ name: '', email: '', mobile: '', date: '', time: '' });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Booking Failed", description: "Please try again." });
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 font-sans">
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      />

      <div className="container mx-auto px-4 py-16 md:py-24 max-w-7xl">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-4"
        >
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold tracking-wide mb-2 border border-blue-200">
            Admissions Open for 2026 Batch
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Start Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">College Journey</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Expert counseling, admission assistance, and personalized mentorship—all in one place.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* --- LEFT: Main Enquiry Form (8 Columns) --- */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-7 xl:col-span-8"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-white/60 p-6 md:p-10 relative overflow-hidden">
              {/* Decorative Blur */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-100/40 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm">
                    <GraduationCap className="h-7 w-7 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Admission Enquiry Form</h2>
                    <p className="text-sm text-slate-500">Fill in your details to get started.</p>
                  </div>
                </div>

                {leadLocked ? (
                  <LockedNotice title="You already shared your admission enquiry." />
                ) : (
                <form onSubmit={submitMainForm} className="space-y-6">
                  {/* Grid Layout for Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Full Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Full Name</label>
                      <div className="relative group">
                        <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="user_name" 
                          placeholder="John Doe" 
                          value={mainForm.user_name} 
                          onChange={handleMainChange} 
                          className={cn("pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all", mainErrors.user_name && "border-red-500")} 
                        />
                      </div>
                      {mainErrors.user_name && <p className="text-xs text-red-500 pl-1">{mainErrors.user_name}</p>}
                    </div>

                    {/* Mobile */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Mobile Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="mobile" 
                          maxLength={10} 
                          placeholder="98765 43210" 
                          value={mainForm.mobile} 
                          onChange={handleMainChange} 
                          className={cn("pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all", mainErrors.mobile && "border-red-500")} 
                        />
                      </div>
                      {mainErrors.mobile && <p className="text-xs text-red-500 pl-1">{mainErrors.mobile}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="email" 
                          type="email" 
                          placeholder="john@example.com" 
                          value={mainForm.email} 
                          onChange={handleMainChange} 
                          className={cn("pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all", mainErrors.email && "border-red-500")} 
                        />
                      </div>
                      {mainErrors.email && <p className="text-xs text-red-500 pl-1">{mainErrors.email}</p>}
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">City</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="city" 
                          placeholder="Mumbai, Delhi..." 
                          value={mainForm.city} 
                          onChange={handleMainChange} 
                          className={cn("pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all", mainErrors.city && "border-red-500")} 
                        />
                      </div>
                    </div>

                    {/* Course */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Course Interest</label>
                      <div className="relative group">
                        <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="course_of_interest" 
                          placeholder="MBA, B.Tech, MBBS..." 
                          value={mainForm.course_of_interest} 
                          onChange={handleMainChange} 
                          className={cn("pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all", mainErrors.course_of_interest && "border-red-500")} 
                        />
                      </div>
                    </div>

                    {/* State */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">State</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="state" 
                          placeholder="Maharashtra, UP..." 
                          value={mainForm.state} 
                          onChange={handleMainChange} 
                          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all" 
                        />
                      </div>
                    </div>

                    {/* Colleges */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Target Colleges</label>
                      <div className="relative group">
                        <GraduationCap className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="preferred_colleges" 
                          placeholder="Any specific colleges you are targeting?" 
                          value={mainForm.preferred_colleges} 
                          onChange={handleMainChange} 
                          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all" 
                        />
                      </div>
                    </div>

                    {/* 12th % */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">12th Percentage</label>
                      <div className="relative group">
                        <Percent className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input 
                          name="percentage_12th" 
                          placeholder="e.g. 85%" 
                          value={mainForm.percentage_12th} 
                          onChange={handleMainChange} 
                          className="pl-10 h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all" 
                        />
                      </div>
                    </div>

                    {/* Entrance Exam & Score */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Entrance Exam</label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Trophy className="absolute left-3 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
                          <select 
                            name="entrance_exam"
                            value={mainForm.entrance_exam}
                            onChange={handleMainChange}
                            className="w-full h-12 pl-9 pr-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none text-slate-700 transition-all"
                          >
                            <option value="">Exam</option>
                            <option value="JEE">JEE</option>
                            <option value="NEET">NEET</option>
                            <option value="CAT">CAT</option>
                            <option value="MAT">MAT</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="relative">
                           <Input 
                            name="exam_score" 
                            placeholder="Score/Rank" 
                            value={mainForm.exam_score} 
                            onChange={handleMainChange} 
                            className="h-12 bg-white border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 text-center transition-all" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Highlights Options */}
                  <div className="grid md:grid-cols-2 gap-4 pt-4">
                    {/* Highlight 1: Mentorship (Yellow) */}
                    <div 
                      onClick={() => toggleMainOption('want_mentorship')}
                      className={cn(
                        "cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-1 select-none",
                        mainForm.want_mentorship 
                          ? "bg-amber-50/80 border-amber-400 shadow-md shadow-amber-500/10" 
                          : "bg-white border-slate-100 hover:border-amber-200"
                      )}
                    >
                      <div className={cn("p-3 rounded-xl transition-colors", mainForm.want_mentorship ? "bg-amber-400 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-500")}>
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className={cn("font-bold text-sm", mainForm.want_mentorship ? "text-amber-900" : "text-slate-800")}>Free Mentorship</h4>
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", mainForm.want_mentorship ? "border-amber-500 bg-amber-500" : "border-slate-300")}>
                             {mainForm.want_mentorship && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Get 1-on-1 guidance from experts.</p>
                      </div>
                      {mainForm.want_mentorship && <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/20 pointer-events-none animate-pulse" />}
                    </div>

                    {/* Highlight 2: Loan (Mint Green) */}
                    <div 
                      onClick={() => toggleMainOption('want_loan_assistance')}
                      className={cn(
                        "cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-300 flex items-center gap-4 group hover:shadow-lg hover:-translate-y-1 select-none",
                        mainForm.want_loan_assistance 
                          ? "bg-emerald-50/80 border-emerald-400 shadow-md shadow-emerald-500/10" 
                          : "bg-white border-slate-100 hover:border-emerald-200"
                      )}
                    >
                      <div className={cn("p-3 rounded-xl transition-colors", mainForm.want_loan_assistance ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500")}>
                        <IndianRupee className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                         <div className="flex justify-between items-center">
                          <h4 className={cn("font-bold text-sm", mainForm.want_loan_assistance ? "text-emerald-900" : "text-slate-800")}>Free Loan Help</h4>
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors", mainForm.want_loan_assistance ? "border-emerald-500 bg-emerald-500" : "border-slate-300")}>
                             {mainForm.want_loan_assistance && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Check eligibility & best rates.</p>
                      </div>
                      {mainForm.want_loan_assistance && <div className="absolute inset-0 rounded-2xl ring-2 ring-emerald-500/20 pointer-events-none animate-pulse" />}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      disabled={isMainSubmitting}
                      className="w-full h-14 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-lg font-bold rounded-xl shadow-xl shadow-blue-600/25 transition-all hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-3 group active:scale-[0.98]"
                    >
                      {isMainSubmitting ? <Loader2 className="animate-spin" /> : (
                        <>
                          Submit Enquiry <Send className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {/* Footer Text */}
                  <div className="text-center pt-2">
                    {leadLocked ? (
                      <p className="text-sm text-slate-500">You already booked / submitted. Unlock above if you need another slot.</p>
                    ) : (
                      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                        <DialogTrigger asChild>
                          <button className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 mx-auto group bg-white/50 px-4 py-2 rounded-full border border-transparent hover:border-blue-100 hover:bg-blue-50/50">
                            Need a specific time? <span className="underline decoration-slate-300 group-hover:decoration-blue-600 underline-offset-4 font-semibold">Book a counseling call instead.</span>
                            <Clock className="h-3.5 w-3.5 group-hover:text-blue-600" />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Schedule a Call</DialogTitle>
                            <DialogDescription>Select a convenient time for a 15-min session.</DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleBookingSubmit} className="space-y-4 pt-4">
                            <Input name="name" placeholder="Name" required value={bookingForm.name} onChange={(e) => setBookingForm({...bookingForm, name: e.target.value})} className="rounded-xl h-11" />
                            <Input name="mobile" placeholder="Mobile" required value={bookingForm.mobile} onChange={(e) => setBookingForm({...bookingForm, mobile: e.target.value})} className="rounded-xl h-11" />
                            <Input name="email" type="email" placeholder="Email" required value={bookingForm.email} onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})} className="rounded-xl h-11" />
                            <div className="grid grid-cols-2 gap-3">
                              <Input type="date" name="date" required value={bookingForm.date} onChange={(e) => setBookingForm({...bookingForm, date: e.target.value})} className="rounded-xl h-11" />
                              <Input type="time" name="time" required value={bookingForm.time} onChange={(e) => setBookingForm({...bookingForm, time: e.target.value})} className="rounded-xl h-11" />
                            </div>
                            <Button type="submit" disabled={isBookingSubmitting} className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700">
                              {isBookingSubmitting ? "Booking..." : "Confirm Booking"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                </form>
                )}
              </div>
            </div>
          </motion.div>

          {/* --- RIGHT: Secondary Mentorship Request Form (4 Columns) --- */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-24"
          >
            {/* Mentorship Card */}
            <div className="bg-white/70 backdrop-blur-md rounded-[30px] p-6 md:p-8 border border-white/50 shadow-xl shadow-purple-500/5 relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
               {/* Decorative background shapes */}
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/20 rounded-full blur-2xl" />

               <div className="relative z-10">
                 <div className="text-center mb-6">
                   <div className="inline-flex p-3 bg-gradient-to-br from-purple-100 to-indigo-50 rounded-2xl mb-3 shadow-inner border border-purple-100">
                     <GraduationCap className="h-6 w-6 text-purple-600" />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900">Request Mentorship</h3>
                   <p className="text-sm text-slate-500 mt-1 font-medium">Connect with seniors from top colleges.</p>
                 </div>

                {leadLocked ? (
                  <LockedNotice title="Mentorship request already received." />
                ) : (
                <form onSubmit={submitMentorForm} className="space-y-4">
                   <Input 
                      name="name" 
                      placeholder="Your Name" 
                      value={mentorForm.name} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 h-11 rounded-xl transition-all"
                   />
                   <Input 
                      name="email" 
                      type="email"
                      placeholder="Email Address" 
                      value={mentorForm.email} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 h-11 rounded-xl transition-all"
                   />
                   <Input 
                      name="contact" 
                      placeholder="Contact Number" 
                      value={mentorForm.contact} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 h-11 rounded-xl transition-all"
                   />
                   <Input 
                      name="location" 
                      placeholder="City/State" 
                      value={mentorForm.location} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 h-11 rounded-xl transition-all"
                   />
                   <Input 
                      name="course" 
                      placeholder="Course Interest" 
                      value={mentorForm.course} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 h-11 rounded-xl transition-all"
                   />
                   <Input 
                      name="colleges" 
                      placeholder="Target Colleges" 
                      value={mentorForm.colleges} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 h-11 rounded-xl transition-all"
                   />
                   <Textarea 
                      name="message" 
                      placeholder="Any specific questions for your mentor?" 
                      value={mentorForm.message} 
                      onChange={handleMentorChange}
                      className="bg-white/80 border-purple-100 focus:ring-purple-500/10 focus:border-purple-400 rounded-xl resize-none min-h-[80px] transition-all"
                   />

                   <Button 
                      type="submit" 
                      disabled={isMentorSubmitting}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-purple-500/30 transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] border border-white/20"
                    >
                      {isMentorSubmitting ? <Loader2 className="animate-spin" /> : (
                        <span className="flex items-center gap-2">
                          Get a Mentor <ArrowRight className="h-4 w-4" />
                        </span>
                      )}
                    </Button>
                </form>
                )}
               </div>
            </div>
            
            {/* WhatsApp Info Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[24px] p-6 shadow-xl shadow-blue-500/25 flex flex-col items-center text-center relative overflow-hidden group">
               {/* Abstract Shapes */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-colors duration-500" />
               <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-400/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
               
               <div className="relative z-10 w-full">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/10">
                    <MessageSquare className="h-6 w-6 text-white" />
                 </div>
                 <h4 className="font-bold text-lg mb-1">Need Immediate Help?</h4>
                 <p className="text-blue-100 text-sm mb-5 font-medium opacity-90">Our support team is available on WhatsApp.</p>
                 <Button 
                    onClick={() => window.open('https://wa.me/917065657041', '_blank')}
                    variant="secondary" 
                    className="w-full h-11 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl border border-transparent hover:border-white shadow-lg shadow-black/5 transition-all hover:-translate-y-0.5"
                 >
                   Chat on WhatsApp
                 </Button>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default ContactPage;
