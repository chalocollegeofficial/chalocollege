
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calculator, IndianRupee, PieChart, Percent, Calendar, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { notifyAdminNewLead } from '@/utils/emailService';
import { useToast } from '@/components/ui/use-toast';
import { validateName, validateEmail, validatePhone, handleNumericInput } from '@/utils/validation';
import { motion } from 'framer-motion';

const EMICalculatorSection = () => {
  const { toast } = useToast();
  
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
        page_from: 'EMI Calculator - Home',
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
    <section className="py-16 md:py-20 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/40 rounded-full blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/40 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 translate-y-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-white shadow-sm border border-gray-100 rounded-2xl mb-4">
            <Calculator className="h-6 w-6 text-[#f05a22]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Education Loan EMI Calculator</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Plan your future with Bank of Baroda's affordable education loans. Calculate your monthly installments and apply for the best rates today.
          </p>
        </motion.div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          
          {/* COLUMN 1: Inputs */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-300"
          >
            <div className="mb-6 pb-4 border-b border-gray-100">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#f05a22] rounded-full"></span>
                Calculate Your EMI
              </h3>
            </div>

            <div className="space-y-10">
              {/* Loan Amount */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-gray-700 font-semibold flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-gray-400" /> Loan Amount
                  </label>
                  <div className="bg-orange-50 text-[#f05a22] font-bold py-1.5 px-3 rounded-lg border border-orange-100 text-sm">
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
                  className="mb-2 py-4"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>₹50K</span>
                  <span>₹80L</span>
                </div>
              </div>

              {/* Interest Rate */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-gray-700 font-semibold flex items-center gap-2">
                    <Percent className="h-4 w-4 text-gray-400" /> Interest Rate (p.a)
                  </label>
                  <div className="bg-orange-50 text-[#f05a22] font-bold py-1.5 px-3 rounded-lg border border-orange-100 text-sm">
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
                  className="mb-2 py-4"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>6%</span>
                  <span>18%</span>
                </div>
              </div>

              {/* Tenure */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="text-gray-700 font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" /> Tenure (Years)
                  </label>
                  <div className="bg-orange-50 text-[#f05a22] font-bold py-1.5 px-3 rounded-lg border border-orange-100 text-sm">
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
                  className="mb-2 py-4"
                />
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                  <span>1 Year</span>
                  <span>15 Years</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 2: Results */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-orange-50/60 rounded-2xl shadow-sm border border-orange-100 p-6 md:p-8 flex flex-col h-full relative overflow-hidden group hover:shadow-md transition-all duration-300"
          >
             {/* Decorative Background Icon */}
             <PieChart className="absolute -bottom-6 -right-6 w-32 h-32 text-orange-200/50 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-500" />

             <div className="mb-6 pb-4 border-b border-orange-200/50">
               <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#f05a22] rounded-full"></span>
                Repayment Details
              </h3>
            </div>
            
            <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
              <div className="text-center py-8 bg-white rounded-xl shadow-sm border border-orange-100 transform group-hover:-translate-y-1 transition-transform duration-300">
                <p className="text-xs text-gray-500 font-bold mb-2 uppercase tracking-widest">Monthly EMI</p>
                <div className="text-4xl md:text-5xl font-black text-[#f05a22] tracking-tight">
                  {formatCurrency(monthlyEMI)}
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    Principal Amount
                  </div>
                  <span className="font-bold text-gray-900 text-base">{formatCurrency(loanAmount)}</span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-2 h-2 rounded-full bg-[#f05a22]"></div>
                    Total Interest
                  </div>
                  <span className="font-bold text-[#f05a22] text-base">{formatCurrency(totalInterest)}</span>
                </div>

                <div className="border-t border-dashed border-orange-200 my-4"></div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-bold">Total Payable</span>
                  <span className="font-bold text-gray-900 text-xl">{formatCurrency(totalAmount)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* COLUMN 3: Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border-t-4 border-[#f05a22] p-6 md:p-8 flex flex-col h-full hover:shadow-xl transition-shadow duration-300"
          >
             <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900">Get Loan Assistance</h3>
                <p className="text-sm text-gray-500 mt-1">Talk to our loan experts for Bank of Baroda education loans.</p>
              </div>

              <form onSubmit={handleLeadSubmit} className="flex flex-col justify-between flex-1 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Full Name</label>
                    <Input 
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className={`bg-gray-50 h-11 border-gray-200 focus:border-[#f05a22] focus:ring-[#f05a22]/20 transition-all ${formErrors.name ? 'border-red-500' : ''}`}
                    />
                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Mobile Number</label>
                    <Input 
                      name="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      className={`bg-gray-50 h-11 border-gray-200 focus:border-[#f05a22] focus:ring-[#f05a22]/20 transition-all ${formErrors.mobile ? 'border-red-500' : ''}`}
                    />
                    {formErrors.mobile && <p className="text-xs text-red-500 mt-1">{formErrors.mobile}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5 tracking-wide">Email Address</label>
                    <Input 
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="name@example.com"
                      className={`bg-gray-50 h-11 border-gray-200 focus:border-[#f05a22] focus:ring-[#f05a22]/20 transition-all ${formErrors.email ? 'border-red-500' : ''}`}
                    />
                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#f05a22] hover:bg-[#d94e1b] text-white h-12 text-base font-bold shadow-md hover:shadow-xl transition-all rounded-lg group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        Get Best Loan Offer <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-center text-gray-400 mt-3 flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                    Free assistance • No hidden charges
                  </p>
                </div>
              </form>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default EMICalculatorSection;
