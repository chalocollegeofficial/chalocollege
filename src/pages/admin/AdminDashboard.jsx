import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Users, FileQuestion, Calendar, Mail } from 'lucide-react';

const StatCard = ({ title, count, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{count}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    leads: 0,
    contacts: 0,
    bookings: 0,
    subscribers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: leadsCount },
          { count: contactsCount },
          { count: bookingsCount },
          { count: subscribersCount }
        ] = await Promise.all([
          supabase.from('leads').select('*', { count: 'exact', head: true }),
          supabase.from('contact_enquiries').select('*', { count: 'exact', head: true }),
          supabase.from('counseling_bookings').select('*', { count: 'exact', head: true }),
          supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          leads: leadsCount || 0,
          contacts: contactsCount || 0,
          bookings: bookingsCount || 0,
          subscribers: subscribersCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Loading dashboard data...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Leads" 
          count={stats.leads} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Contact Enquiries" 
          count={stats.contacts} 
          icon={FileQuestion} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Counseling Bookings" 
          count={stats.bookings} 
          icon={Calendar} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Newsletter Subs" 
          count={stats.subscribers} 
          icon={Mail} 
          color="bg-yellow-500" 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold mb-4">Welcome, Admin</h2>
        <p className="text-gray-600">
          Use the sidebar to manage leads, blog posts, and college listings. 
          Ensure you review new enquiries daily.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;