import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Mail, Phone, MapPin } from 'lucide-react';

const AdminPGEnquiries = () => {
  const { toast } = useToast();
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('pg_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch enquiries', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this enquiry?')) return;

    try {
      const { error } = await supabase.from('pg_enquiries').delete().eq('id', id);
      if (error) throw error;
      
      setEnquiries(prev => prev.filter(enq => enq.id !== id));
      toast({ title: 'Success', description: 'Enquiry deleted' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const filteredEnquiries = enquiries.filter(enq => 
    enq.name?.toLowerCase().includes(filter.toLowerCase()) ||
    enq.preferred_location?.toLowerCase().includes(filter.toLowerCase()) ||
    enq.budget?.toLowerCase().includes(filter.toLowerCase())
  );

  const extractInterestedPg = (enquiry) => {
    if (!enquiry) return '';
    const direct = enquiry.pg_name || enquiry.pg_listing_name || enquiry.pg || '';
    if (direct) return direct;

    const text = String(enquiry.additional_requirements || '');
    const match = text.match(/Interested\s+in\s*:\s*(.+)/i);
    if (match && match[1]) {
      // Take only the first line after the label
      return match[1].split('\n')[0].trim();
    }
    return '';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">PG Enquiries</h1>
        <input
          type="text"
          placeholder="Filter by name, location or budget..."
          className="px-4 py-2 border rounded-md text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : filteredEnquiries.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No enquiries found</div>
        ) : (
          filteredEnquiries.map((enquiry) => (
            <div key={enquiry.id} className="bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  {extractInterestedPg(enquiry) && (
                    <div className="mb-3">
                      <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-xs font-semibold">
                        PG: {extractInterestedPg(enquiry)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{enquiry.name}</h3>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                      {new Date(enquiry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <a href={`mailto:${enquiry.email}`} className="hover:underline">{enquiry.email}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-green-500" />
                      <a href={`tel:${enquiry.contact_number}`} className="hover:underline">{enquiry.contact_number}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-red-500" />
                      <span className="font-medium">Pref:</span> {enquiry.preferred_location || 'Any'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Budget:</span> ₹ {enquiry.budget || 'Not specified'}
                    </div>
                  </div>

                  {enquiry.additional_requirements && (
                    <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                      <span className="font-semibold block mb-1 text-xs text-gray-500 uppercase">Additional Requirements</span>
                      {enquiry.additional_requirements}
                    </div>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(enquiry.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminPGEnquiries;
