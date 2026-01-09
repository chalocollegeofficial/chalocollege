import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Download, Filter, Search, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, isSameDay, isSameMonth, isSameYear, parseISO } from 'date-fns';
import { toast } from '@/components/ui/use-toast';

const AdminUnifiedLeads = () => {
  const [allLeads, setAllLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [dateFilterType, setDateFilterType] = useState('all'); // 'all', 'day', 'month', 'year'
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy'));

  useEffect(() => {
    fetchUnifiedLeads();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [allLeads, searchTerm, sourceFilter, dateFilterType, selectedDate, selectedMonth, selectedYear]);

  const fetchUnifiedLeads = async () => {
    setLoading(true);
    try {
      // Fetch General Leads
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Fetch PG Enquiries
      const { data: pgData } = await supabase
        .from('pg_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch Counseling Bookings
      const { data: bookingData } = await supabase
        .from('counseling_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      // Normalize Data Structures
      const normalizedLeads = (leadsData || []).map(item => {
        const wantsMentorship = item.want_mentorship ? 'Mentorship: Yes' : '';
        const wantsLoan = item.want_loan_assistance ? 'Loan: Yes' : '';
        const extras = [wantsMentorship, wantsLoan].filter(Boolean).join(' | ');

        return {
          id: `gen-${item.id}`,
          rawDate: item.created_at,
          sourceLabel: 'General Lead',
          subType: item.page_from || 'Website',
          name: item.user_name,
          email: item.email || '-',
          phone: item.phone_number,
          city: item.city || '-',
          context: `Course: ${item.course_of_interest || '-'}${extras ? ' | ' + extras : ''}`,
          rawObj: item
        };
      });

      const normalizedPG = (pgData || []).map(item => ({
        id: `pg-${item.id}`,
        rawDate: item.created_at,
        sourceLabel: 'PG Enquiry',
        subType: 'PG/Hostel',
        name: item.name,
        email: item.email || '-',
        phone: item.contact_number,
        city: item.preferred_location || '-',
        context: `Budget: ${item.budget || '-'}`,
        rawObj: item
      }));

      const normalizedBookings = (bookingData || []).map(item => ({
        id: `book-${item.id}`,
        rawDate: item.created_at,
        sourceLabel: 'Mentorship Booking',
        subType: 'Counseling',
        name: item.name,
        email: item.email || '-',
        phone: item.mobile,
        city: '-', // Bookings might not have city
        context: `Date: ${item.preferred_date || '-'} ${item.preferred_time || ''}`,
        rawObj: item
      }));

      // Combine and Sort by Latest First
      const combined = [...normalizedLeads, ...normalizedPG, ...normalizedBookings]
        .sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

      setAllLeads(combined);
      setFilteredLeads(combined);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ variant: "destructive", title: "Failed to fetch leads" });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...allLeads];

    // 1. Search Text
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(lead => 
        (lead.name || '').toLowerCase().includes(lowerSearch) ||
        (lead.email || '').toLowerCase().includes(lowerSearch) ||
        (lead.phone || '').toLowerCase().includes(lowerSearch) ||
        (lead.city || '').toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Source Filter
    if (sourceFilter !== 'all') {
      result = result.filter(lead => lead.sourceLabel === sourceFilter);
    }

    // 3. Date Filter
    if (dateFilterType !== 'all') {
      result = result.filter(lead => {
        if (!lead.rawDate) return false;
        const leadDate = parseISO(lead.rawDate);
        
        if (dateFilterType === 'day') {
          return isSameDay(leadDate, parseISO(selectedDate));
        } else if (dateFilterType === 'month') {
          // selectedMonth is YYYY-MM
          return isSameMonth(leadDate, parseISO(selectedMonth + '-01'));
        } else if (dateFilterType === 'year') {
          return isSameYear(leadDate, parseISO(selectedYear + '-01-01'));
        }
        return true;
      });
    }

    setFilteredLeads(result);
  };

  const convertToCSV = (data) => {
    const headers = ['Date', 'Time', 'Source', 'Sub Type', 'Name', 'Phone', 'Email', 'City', 'Context/Details'];
    
    const rows = data.map(lead => {
      const dateObj = new Date(lead.rawDate);
      return [
        format(dateObj, 'yyyy-MM-dd'),
        format(dateObj, 'hh:mm a'),
        lead.sourceLabel,
        lead.subType,
        `"${(lead.name || '').replace(/"/g, '""')}"`, // Escape quotes
        `"${(lead.phone || '').replace(/"/g, '""')}"`,
        `"${(lead.email || '').replace(/"/g, '""')}"`,
        `"${(lead.city || '').replace(/"/g, '""')}"`,
        `"${(lead.context || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  };

  const handleExport = () => {
    try {
      const csvData = convertToCSV(filteredLeads);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filterSuffix = dateFilterType !== 'all' ? `_filtered_${dateFilterType}` : '_all';
      link.setAttribute('href', url);
      link.setAttribute('download', `leads${filterSuffix}_${dateStr}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Export Successful", description: `Exported ${filteredLeads.length} rows.` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Export Failed" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unified Lead Management</h1>
          <p className="text-sm text-gray-500">
            Viewing <span className="font-semibold text-blue-600">{filteredLeads.length}</span> leads from all sources.
          </p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={fetchUnifiedLeads}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" /> Export Excel/CSV
            </Button>
        </div>
      </div>

      {/* Filters Container */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
            <Filter className="w-4 h-4"/> Filter Leads
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Search</label>
            <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Name, Phone, City..." 
                  className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Lead Source</label>
            <select 
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
              value={sourceFilter}
              onChange={e => setSourceFilter(e.target.value)}
            >
              <option value="all">All Sources</option>
              <option value="General Lead">General Lead</option>
              <option value="PG Enquiry">PG Enquiry</option>
              <option value="Mentorship Booking">Mentorship Booking</option>
            </select>
          </div>

          {/* Date Type Selector */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date Filter</label>
            <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <select 
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                  value={dateFilterType}
                  onChange={e => setDateFilterType(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="day">Specific Date</option>
                  <option value="month">Specific Month</option>
                  <option value="year">Specific Year</option>
                </select>
            </div>
          </div>

          {/* Dynamic Date Input */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Select Period</label>
            <div className="mt-1">
                {dateFilterType === 'all' && (
                  <input type="text" disabled value="Lifetime" className="w-full px-3 py-2 border rounded-md text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                )}
                
                {dateFilterType === 'day' && (
                  <input 
                    type="date" 
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                  />
                )}

                {dateFilterType === 'month' && (
                  <input 
                    type="month" 
                    className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(e.target.value)}
                  />
                )}

                {dateFilterType === 'year' && (
                  <select 
                     className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-100 outline-none"
                     value={selectedYear}
                     onChange={e => setSelectedYear(e.target.value)}
                  >
                     {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y}>{y}</option>
                     ))}
                  </select>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                <tr>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Lead Source</th>
                  <th className="px-6 py-4">Name / Contact</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Context / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center justify-center">
                            <Search className="w-8 h-8 text-gray-300 mb-2" />
                            <p>No leads found matching your filters.</p>
                        </div>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{format(new Date(lead.rawDate), 'dd MMM yyyy')}</div>
                        <div className="text-xs text-gray-500">{format(new Date(lead.rawDate), 'hh:mm a')}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${lead.sourceLabel === 'General Lead' ? 'bg-blue-100 text-blue-800' : 
                            lead.sourceLabel === 'PG Enquiry' ? 'bg-purple-100 text-purple-800' : 
                            'bg-amber-100 text-amber-800'}`}>
                          {lead.sourceLabel}
                        </span>
                        <div className="text-xs text-gray-400 mt-1 pl-1">{lead.subType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{lead.name}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{lead.phone}</div>
                        <div className="text-blue-600 text-xs mt-0.5">{lead.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {lead.city}
                      </td>
                      <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={lead.context}>
                        {lead.context}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="text-right text-xs text-gray-400">
         Showing {filteredLeads.length} of {allLeads.length} total records.
      </div>
    </div>
  );
};

export default AdminUnifiedLeads;