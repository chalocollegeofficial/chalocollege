import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, GraduationCap, IndianRupee, CheckCircle2, ShieldCheck, Sparkles, Phone, Mail, User, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { notifyAdminNewLead } from '@/utils/emailService';
import { toast } from '@/components/ui/use-toast';
import { validateCourse, validatePhone, validateName, validateEmail, handleNumericInput } from '@/utils/validation';
import { cn } from '@/lib/utils';
import { useSubmissionLock } from '@/utils/useSubmissionLock';
const LeadPopup = ({
  isOpen,
  onClose,
  source = "popup",
  targetCollege = "",
  onSuccess
}) => {
  const { hasSubmitted, markSubmitted } = useSubmissionLock('lead-global', 180);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    course_of_interest: '',
    want_mentorship: true,
    // Default checked as it's a benefit
    want_loan_assistance: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-close if already submitted elsewhere
  useEffect(() => {
    if (hasSubmitted && isOpen) {
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [hasSubmitted, isOpen, onClose, onSuccess]);
  const validateField = (name, value) => {
    let error = '';
    if (name === 'course_of_interest' && value && !validateCourse(value)) error = 'Invalid characters.';
    if (name === 'name' && value && !validateName(value)) error = 'Min 2 characters, alphabets only.';
    if (name === 'mobile' && value && value.length !== 10) error = 'Must be 10 digits.';
    if (name === 'email' && value && !validateEmail(value)) error = 'Invalid email address.';
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };
  const handleChange = e => {
    const {
      name,
      value
    } = e.target;
    if (name === 'mobile') {
      const val = handleNumericInput(e, 10);
      if (val !== undefined) {
        setFormData(prev => ({
          ...prev,
          [name]: val
        }));
        validateField(name, val);
      }
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };
  const toggleFeature = featureKey => {
    setFormData(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  };
  const handleSubmit = async e => {
    e.preventDefault();

    // Validation
    const newErrors = {};
    if (!validateName(formData.name)) newErrors.name = "Enter valid name";
    if (!validateEmail(formData.email)) newErrors.email = "Enter valid email";
    if (!validatePhone(formData.mobile)) newErrors.mobile = "Enter 10-digit mobile";
    if (formData.course_of_interest && !validateCourse(formData.course_of_interest)) newErrors.course_of_interest = "Invalid course";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({
        variant: "destructive",
        title: "Check Details",
        description: Object.values(newErrors)[0]
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const submissionData = {
        user_name: formData.name,
        email: formData.email,
        phone_number: formData.mobile,
        course_of_interest: formData.course_of_interest,
        page_from: source,
        preferred_colleges: targetCollege,
        want_mentorship: formData.want_mentorship,
        want_loan_assistance: formData.want_loan_assistance
      };
      const { data, error } = await supabase.from('leads').insert([submissionData]).select();
      if (error) throw error;

      // Fire admin email notification (non-blocking for UX)
      if (data && data.length > 0) {
        notifyAdminNewLead(data[0]);
      }
      toast({
        title: "Request Received! 🎓",
        description: "Our expert counselors will connect with you shortly.",
        className: "bg-green-50 border-green-200 text-green-900 font-medium"
      });
      // Persist flags for legacy checks + new global lock
      sessionStorage.setItem('leadSubmitted', 'true');
      localStorage.setItem('leadSubmitted', 'true');
      markSubmitted();
      setFormData({
        name: '',
        email: '',
        mobile: '',
        course_of_interest: '',
        want_mentorship: true,
        want_loan_assistance: false
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Lead submission error:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Please try again later."
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={open => !isSubmitting && onClose(open)}>
      <DialogContent className="sm:max-w-[460px] p-0 gap-0 overflow-hidden rounded-2xl border-0 shadow-2xl bg-white/95 backdrop-blur-xl ring-1 ring-black/5">
        
        {/* Modern Header */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 text-white relative overflow-hidden">
          {/* Abstract BG Shapes */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
          
          <DialogHeader className="relative z-10 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-md border border-white/10 shadow-inner">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="bg-blue-500/30 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-400/30 text-blue-50 shadow-sm uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Free Admission Help
              </span>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-tight">
              Get Expert Guidance
            </DialogTitle>
            <p className="text-blue-100 mt-1.5 text-sm font-medium opacity-90 leading-relaxed">
              Unlock college insights, fees, and personalized counseling from our experts.
            </p>
          </DialogHeader>
        </div>

        <div className="p-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className={cn("pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm rounded-xl font-medium placeholder:font-normal", errors.name && "border-red-500 focus:ring-red-200 bg-red-50/10")} />
              </div>

              {/* Mobile & Email Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative group">
                  <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input name="mobile" type="tel" maxLength={10} placeholder="Mobile Number" value={formData.mobile} onChange={handleChange} className={cn("pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm rounded-xl font-medium placeholder:font-normal", errors.mobile && "border-red-500 focus:ring-red-200 bg-red-50/10")} />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input name="email" type="email" placeholder="Email Address" value={formData.email} onChange={handleChange} className={cn("pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm rounded-xl font-medium placeholder:font-normal", errors.email && "border-red-500 focus:ring-red-200 bg-red-50/10")} />
                </div>
              </div>

              {/* Course */}
              <div className="relative group">
                <BookOpen className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input name="course_of_interest" placeholder="Course of Interest (e.g. MBA, B.Tech)" value={formData.course_of_interest} onChange={handleChange} className={cn("pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm rounded-xl font-medium placeholder:font-normal", errors.course_of_interest && "border-red-500 focus:ring-red-200 bg-red-50/10")} />
              </div>
            </div>

            {/* Selectable Feature Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Extra Benefits (Optional)</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Mentorship Card */}
                <div onClick={() => toggleFeature('want_mentorship')} className={cn("cursor-pointer group relative p-3.5 rounded-xl border-2 transition-all duration-200 flex flex-col justify-between h-[100px] hover:-translate-y-0.5", formData.want_mentorship ? "border-blue-500 bg-blue-50/60 shadow-md shadow-blue-500/10" : "border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm")}>
                  <div className="flex justify-between items-start">
                    <div className={cn("p-1.5 rounded-lg transition-colors", formData.want_mentorship ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400 group-hover:text-blue-500 group-hover:bg-blue-50")}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    {formData.want_mentorship && <div className="bg-blue-500 rounded-full p-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded tracking-wider mb-1 inline-block border border-green-200">FREE</span>
                    <p className={cn("font-bold text-sm leading-none", formData.want_mentorship ? "text-blue-900" : "text-gray-600")}>Mentorship</p>
                  </div>
                </div>

                {/* Loan Assistance Card */}
                <div onClick={() => toggleFeature('want_loan_assistance')} className={cn("cursor-pointer group relative p-3.5 rounded-xl border-2 transition-all duration-200 flex flex-col justify-between h-[100px] hover:-translate-y-0.5", formData.want_loan_assistance ? "border-indigo-500 bg-indigo-50/60 shadow-md shadow-indigo-500/10" : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm")}>
                  <div className="flex justify-between items-start">
                    <div className={cn("p-1.5 rounded-lg transition-colors", formData.want_loan_assistance ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50")}>
                      <IndianRupee className="h-4 w-4" />
                    </div>
                    {formData.want_loan_assistance && <div className="bg-indigo-500 rounded-full p-0.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded tracking-wider mb-1 inline-block border border-green-200">FREE</span>
                    <p className={cn("font-bold text-sm leading-none", formData.want_loan_assistance ? "text-indigo-900" : "text-gray-600")}>Loan Help</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Area */}
            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[15px] shadow-lg shadow-blue-500/25 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border border-blue-400/20">
                {isSubmitting ? <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </> : "Get Started Now"}
              </Button>
              
              <div className="mt-4 flex items-center justify-center gap-2 opacity-60">
                <ShieldCheck className="h-3.5 w-3.5 text-gray-500" />
                <p className="text-[11px] text-gray-500 font-medium">
                  No cost • No hidden charges • 100% Secure
                </p>
              </div>
            </div>

          </form>
        </div>
      </DialogContent>
    </Dialog>;
};
export default LeadPopup;
