import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2 } from 'lucide-react';
import { validateCity, validateName, validateEmail, validatePhone, handleNumericInput } from '@/utils/validation';

const PGEnquiryModal = ({ isOpen, onClose, prefillLocation = '' }) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_number: '',
    budget: '',
    preferred_location: prefillLocation,
    additional_requirements: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'contact_number') {
        const val = handleNumericInput(e, 10);
        if (val !== undefined) setFormData(prev => ({ ...prev, [name]: val }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Inline validation
    if (name === 'preferred_location') {
        setErrors(prev => ({...prev, preferred_location: !validateCity(value) ? 'City must be alphabets only' : ''}));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Strict validation before submit
    const newErrors = {};
    if (!validateName(formData.name)) newErrors.name = "Invalid name";
    if (!validateEmail(formData.email)) newErrors.email = "Invalid email";
    if (!validatePhone(formData.contact_number)) newErrors.contact_number = "10 digit number required";
    if (formData.preferred_location && !validateCity(formData.preferred_location)) newErrors.preferred_location = "Invalid city";

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('pg_enquiries')
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Enquiry Sent!",
        description: "We'll help you find the perfect PG soon.",
        variant: "default",
      });
      
      setFormData({
        name: '',
        email: '',
        contact_number: '',
        budget: '',
        preferred_location: '',
        additional_requirements: ''
      });
      setErrors({});
      onClose();

    } catch (error) {
      console.error('Error submitting PG enquiry:', error);
      toast({
        title: "Error",
        description: "Failed to send enquiry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find Your Perfect PG</DialogTitle>
          <DialogDescription>
            Fill in your details and preferences to get the best PG options.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name *</label>
              <input
                required
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.name ? 'border-red-500' : 'border-input'}`}
                placeholder="Your Name"
              />
              {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact Number *</label>
              <input
                required
                name="contact_number"
                value={formData.contact_number}
                onChange={handleChange}
                maxLength={10}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.contact_number ? 'border-red-500' : 'border-input'}`}
                placeholder="Mobile Number"
              />
              {errors.contact_number && <span className="text-xs text-red-500">{errors.contact_number}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address *</label>
            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.email ? 'border-red-500' : 'border-input'}`}
              placeholder="your@email.com"
            />
             {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Budget (Monthly)</label>
              <input
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="e.g. 5000-8000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Location</label>
              <input
                name="preferred_location"
                value={formData.preferred_location}
                onChange={handleChange}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${errors.preferred_location ? 'border-red-500' : 'border-input'}`}
                placeholder="City or Area"
              />
              {errors.preferred_location && <span className="text-xs text-red-500">{errors.preferred_location}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Requirements</label>
            <textarea
              name="additional_requirements"
              value={formData.additional_requirements}
              onChange={handleChange}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Any specific needs? (e.g., AC, Single Room, Food included)"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Submit Enquiry'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PGEnquiryModal;