
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, IndianRupee, PieChart, Percent, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { notifyAdminNewLead } from '@/utils/emailService';
import { toast } from '@/components/ui/use-toast';
import { validateName, validateEmail, validatePhone, handleNumericInput } from '@/utils/validation';
import { useSubmissionLock } from '@/utils/useSubmissionLock';
import SeoHead from '@/components/common/SeoHead';
import { STATIC_PAGE_SEO } from '@/lib/seo';

const EMICalculatorPage = () => {
  const pageSeo = STATIC_PAGE_SEO.emi;
  // Using direct toast import instead of hook
  
  // Calculator State
  const [loanAmount, setLoanAmount] = useState(1000000); // 10 Lakh default
  const [interestRate, setInterestRate] = useState(9.50); // BoB typical rate
  const [tenure, setTenure] = useState(10); // 10 years default
  
  // Results State
  const [monthlyEMI, setMonthlyEMI] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasSubmitted: leadLocked, markSubmitted: lockLead, clearLock } = useSubmissionLock('lead-global', 180);
  const LockedNotice = () => (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-100 rounded-2xl p-6 shadow-sm space-y-2">
      <h3 className="text-lg font-semibold text-slate-900">Details already captured.</h3>
      <p className="text-sm text-slate-600">We will reach out with loan options. Unlock if you need to resubmit with new numbers.</p>
      <Button variant="outline" onClick={clearLock}>Unlock &amp; submit again</Button>
    </div>
  );

  // Constants
  const MIN_AMOUNT = 50000;
  const MAX_AMOUNT = 8000000; // 80 Lakhs
  const MIN_RATE = 6;
  const MAX_RATE = 18;
  const MIN_TENURE = 1;
  const MAX_TENURE = 15;

  useEffect(() => {
    calculateEMI();
  }, [loanAmount, interestRate, tenure]);

  const calculateEMI = () => {
    const principal = loanAmount;
    const ratePerMonth = interestRate / (12 * 100);
    const months = tenure * 12;

    const emi = principal * ratePerMonth * Math.pow(1 + ratePerMonth, months) / (Math.pow(1 + ratePerMonth, months) - 1);
    
    const totalPayment = emi * months;
    const totalInt = totalPayment - principal;

    setMonthlyEMI(Math.round(emi));
    setTotalAmount(Math.round(totalPayment));
    setTotalInterest(Math.round(totalInt));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      const val = handleNumericInput(e, 10);
      if (val !== undefined) setFormData(prev => ({ ...prev, [name]: val }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    // Clear error when user types
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    const errors = {};
    if (!validateName(formData.name)) errors.name = "Please enter a valid full name";
    if (!validateEmail(formData.email)) errors.email = "Please enter a valid email address";
    if (!validatePhone(formData.mobile)) errors.mobile = "Please enter a valid 10-digit mobile number";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const message = `Bank of Baroda EMI Inquiry. Loan: ${formatCurrency(loanAmount)}, Rate: ${interestRate}%, Tenure: ${tenure} Years. EMI: ${formatCurrency(monthlyEMI)}`;
      
      const { data, error } = await supabase.from('leads').insert([{
        user_name: formData.name,
        email: formData.email,
        phone_number: formData.mobile,
        page_from: 'EMI Calculator - BoB',
        course_of_interest: 'Education Loan',
        want_loan_assistance: true,
        message: message
      }]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        notifyAdminNewLead(data[0]);
      }

      toast({
        title: "Calculation Saved!",
        description: "Our loan expert will contact you shortly with the best Bank of Baroda offers.",
        className: "bg-green-50 border-green-200 text-green-900"
      });
      lockLead();
      setFormData({ name: '', email: '', mobile: '' });
    } catch (error) {
      console.error('Error submitting lead:', error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <SeoHead
        title={pageSeo.title}
        description={pageSeo.description}
        keywords={pageSeo.keywords}
        canonicalPath={pageSeo.canonicalPath}
      />

      {/* Hero Section */}
      <div className="bg-[#f05a22] text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Calculator className="h-10 w-10 text-white/90" />
                <h1 className="text-3xl md:text-4xl font-bold">Education Loan EMI Calculator</h1>
              </div>
              <p className="text-lg text-white/90 max-w-xl">
                Plan your future with Bank of Baroda's affordable education loans. Calculate your monthly installments and apply for the best rates today.
              </p>
            </div>
            {/* Simple Visual Badge */}
            <div className="hidden md:block bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
              <div className="text-sm font-medium text-white/80 uppercase tracking-wider mb-1">Current BoB Rates</div>
              <div className="text-3xl font-bold text-white">8.50% - 11.25%*</div>
              <div className="text-xs text-white/60 mt-1">*Rates subject to change</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Calculator Section (Left) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 md:p-8">
              <h2 className="text-xl font-bold text-gray-800 mb-8 flex items-center gap-2">
                <span className="w-1 h-6 bg-[#f05a22] rounded-full"></span>
                Calculate Your EMI
              </h2>

              {/* Loan Amount */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-gray-600 font-semibold flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" /> Loan Amount
                  </label>
                  <div className="bg-orange-50 text-[#f05a22] font-bold py-1 px-3 rounded-md border border-orange-100">
                    {formatCurrency(loanAmount)}
                  </div>
                </div>
                <Slider 
                  defaultValue={[loanAmount]} 
                  value={[loanAmount]}
                  min={MIN_AMOUNT} 
                  max={MAX_AMOUNT} 
                  step={10000}
                  onValueChange={(val) => setLoanAmount(val[0])}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                  <span>₹50K</span>
                  <span>₹80L</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div className="mb-10">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-gray-600 font-semibold flex items-center gap-2">
                    <Percent className="h-4 w-4" /> Interest Rate (p.a)
                  </label>
                  <div className="bg-orange-50 text-[#f05a22] font-bold py-1 px-3 rounded-md border border-orange-100">
                    {interestRate}%
                  </div>
                </div>
                <Slider 
                  defaultValue={[interestRate]} 
                  value={[interestRate]}
                  min={MIN_RATE} 
                  max={MAX_RATE} 
                  step={0.1}
                  onValueChange={(val) => setInterestRate(val[0])}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                  <span>6%</span>
                  <span>18%</span>
                </div>
              </div>

              {/* Tenure */}
              <div className="mb-8">
                <div className="flex justify-between items-end mb-4">
                  <label className="text-gray-600 font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Tenure (Years)
                  </label>
                  <div className="bg-orange-50 text-[#f05a22] font-bold py-1 px-3 rounded-md border border-orange-100">
                    {tenure} Years
                  </div>
                </div>
                <Slider 
                  defaultValue={[tenure]} 
                  value={[tenure]}
                  min={MIN_TENURE} 
                  max={MAX_TENURE} 
                  step={1}
                  onValueChange={(val) => setTenure(val[0])}
                  className="mb-2"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
                  <span>1 Year</span>
                  <span>15 Years</span>
                </div>
              </div>

              {/* Results Breakdown Box for Mobile (Hidden on Desktop, shown on mobile for better flow) */}
              <div className="lg:hidden mt-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-500 mb-1">Your Monthly EMI</p>
                  <p className="text-3xl font-extrabold text-[#f05a22]">{formatCurrency(monthlyEMI)}</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Interest</span>
                    <span className="font-semibold">{formatCurrency(totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Sidebar Section (Right) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Results Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hidden lg:block">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-[#f05a22]" /> Repayment Details
              </h3>
              
              <div className="text-center py-6 bg-orange-50 rounded-xl mb-6 border border-orange-100">
                <p className="text-sm text-gray-500 font-medium mb-1 uppercase tracking-wide">Monthly EMI</p>
                <div className="text-4xl font-black text-[#f05a22]">
                  {formatCurrency(monthlyEMI)}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600 text-sm">Principal Amount</span>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(loanAmount)}</span>
                </div>

                <div className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#f05a22]"></div>
                    <span className="text-gray-600 text-sm">Total Interest</span>
                  </div>
                  <span className="font-bold text-[#f05a22]">{formatCurrency(totalInterest)}</span>
                </div>

                <div className="border-t border-dashed border-gray-200 my-4"></div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-800 font-bold text-sm">Total Payable</span>
                  <span className="font-bold text-gray-900">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Lead Form Card */}
            <div className="bg-white rounded-xl shadow-lg border-t-4 border-[#f05a22] p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900">Get Loan Assistance</h3>
                <p className="text-sm text-gray-500 mt-1">Talk to our loan experts for Bank of Baroda education loans.</p>
              </div>

              {leadLocked ? (
                <LockedNotice />
              ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Full Name</label>
                  <Input 
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className={`bg-gray-50 ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Mobile Number</label>
                  <Input 
                    name="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={`bg-gray-50 ${formErrors.mobile ? 'border-red-500' : ''}`}
                  />
                  {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email Address</label>
                  <Input 
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="name@example.com"
                    className={`bg-gray-50 ${formErrors.email ? 'border-red-500' : ''}`}
                  />
                  {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#f05a22] hover:bg-[#d94e1b] text-white py-6 text-lg font-bold shadow-md hover:shadow-xl transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Get Best Loan Offer'
                  )}
                </Button>
                
                <p className="text-xs text-center text-gray-400 mt-3">
                  <CheckCircle2 className="h-3 w-3 inline mr-1 text-green-500" />
                  Free assistance • No hidden charges
                </p>
              </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default EMICalculatorPage;
