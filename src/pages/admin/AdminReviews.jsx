import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AdminReviews = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('college_reviews')
        .select(`
          *,
          colleges (
            college_name
          )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'pending') {
        query = query.eq('status', 'PENDING');
      } else if (activeTab === 'approved') {
        query = query.eq('status', 'APPROVED');
      } else if (activeTab === 'rejected') {
        query = query.eq('status', 'REJECTED');
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error fetching reviews', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const isVerified = newStatus === 'APPROVED';
      const { error } = await supabase
        .from('college_reviews')
        .update({ 
          status: newStatus,
          is_verified: isVerified
        })
        .eq('id', id);

      if (error) throw error;
      
      setReviews(prev => prev.filter(r => r.id !== id));
      toast({ 
        title: `Review ${newStatus}`, 
        className: newStatus === 'APPROVED' ? 'bg-green-600 text-white' : 'bg-red-600 text-white' 
      });
    } catch (error) {
      toast({ title: 'Update Failed', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
        <Button variant="outline" size="sm" onClick={fetchReviews}>
           <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="pending">Pending Verification</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-blue-600" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-gray-500 p-10 bg-white rounded-lg shadow border border-dashed text-center">
              No {activeTab} reviews found.
            </div>
          ) : (
            <div className="grid gap-6">
               {reviews.map(review => (
                 <div key={review.id} className="bg-white p-6 rounded-lg border shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex flex-col md:flex-row justify-between items-start mb-4 gap-4">
                       <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">{review.student_name}</h3>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border">
                               {review.colleges?.college_name || 'Unknown College'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{review.email}</p>
                          {review.linkedin_url && (
                             <a href={review.linkedin_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center mt-1">
                                <ExternalLink className="h-3 w-3 mr-1" /> LinkedIn Profile
                             </a>
                          )}
                          <div className="mt-2 text-sm font-medium text-yellow-600">
                             Rating: {review.rating}/5
                          </div>
                       </div>
                       
                       {activeTab === 'pending' && (
                         <div className="flex gap-2 w-full md:w-auto">
                            <Button size="sm" onClick={() => handleStatusChange(review.id, 'APPROVED')} className="flex-1 bg-green-600 hover:bg-green-700">
                               <CheckCircle className="h-4 w-4 mr-1" /> Verify & Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(review.id, 'REJECTED')} className="flex-1">
                               <XCircle className="h-4 w-4 mr-1" /> Reject
                            </Button>
                         </div>
                       )}
                       
                       {activeTab !== 'pending' && (
                          <div className={`px-3 py-1 rounded text-sm font-bold ${activeTab === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {activeTab.toUpperCase()}
                          </div>
                       )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 border-t pt-4">
                       <div>
                          <p className="font-semibold text-xs text-gray-500 uppercase mb-2">Review Content</p>
                          <div className="bg-gray-50 p-4 rounded text-sm text-gray-800 leading-relaxed h-full">
                            {review.review_text}
                          </div>
                       </div>
                       
                       <div>
                          <p className="font-semibold text-xs text-gray-500 uppercase mb-2">ID Proof Document</p>
                          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 flex flex-col items-center justify-center h-48 relative overflow-hidden group">
                             {review.id_card_url ? (
                               <>
                                 <img src={review.id_card_url} alt="ID Proof" className="max-h-full max-w-full object-contain" />
                                 <a 
                                    href={review.id_card_url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium"
                                 >
                                    <ExternalLink className="mr-2" /> View Full Size
                                 </a>
                               </>
                             ) : (
                               <span className="text-red-500 text-sm">No ID uploaded</span>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReviews;