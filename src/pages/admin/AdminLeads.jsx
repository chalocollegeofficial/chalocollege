import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { format, isSameDay, subDays } from 'date-fns';
import {
  AlertCircle,
  ArrowUpDown,
  BookOpen,
  CheckCircle, Clock,
  Download, Filter,
  Loader2,
  Mail, MapPin,
  Phone,
  Search
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell, Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis, YAxis
} from 'recharts';

const AdminLeads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Analytics Data
  const [stats, setStats] = useState({ total: 0, today: 0, ongoing: 0, closed: 0 });
  const [dailyData, setDailyData] = useState([]);
  const [sourceData, setSourceData] = useState([]);          // chart data (top + other)
  const [sourceOptions, setSourceOptions] = useState([]);    // dropdown data (all normalized)
  const [sourceSummary, setSourceSummary] = useState([]);    // list of top sources with %
  const [topSourcesExpanded, setTopSourcesExpanded] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog
  const [selectedLead, setSelectedLead] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('New');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const normalizeSource = (val) => {
    if (!val) return 'Unknown';
    let s = String(val).trim().replace(/\s+/g, ' ');
    const splitters = [' - ', ' | ', ' :: ', ' — ', ' – ', ': '];
    for (const sp of splitters) {
      if (s.includes(sp)) {
        s = s.split(sp)[0].trim();
        break;
      }
    }
    return s || 'Unknown';
  };

  const prettySourceName = (s) => {
    if (!s) return 'Unknown';
    return String(s)
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const CustomSourceTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const item = payload[0];
    return (
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-3 py-2">
        <div className="text-sm font-semibold text-gray-900">
          {prettySourceName(item.name)}
        </div>
        <div className="text-xs text-gray-600 mt-1">
          Leads: <span className="font-semibold">{item.value}</span>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sourceFilter, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLeads(data || []);
      calculateAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ variant: "destructive", title: "Failed to fetch leads" });
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (data) => {
    const today = new Date();

    const total = data.length;
    const todayCount = data.filter(l => isSameDay(new Date(l.created_at), today)).length;
    const ongoing = data.filter(l => l.status === 'In Progress').length;
    const closed = data.filter(l => l.status === 'Closed').length;
    setStats({ total, today: todayCount, ongoing, closed });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      return { date: format(d, 'MMM dd'), count: 0, fullDate: d };
    });

    data.forEach(lead => {
      const leadDate = new Date(lead.created_at);
      const dayStat = last7Days.find(d => isSameDay(d.fullDate, leadDate));
      if (dayStat) dayStat.count++;
    });
    setDailyData(last7Days);

    const sources = {};
    data.forEach(lead => {
      const src = normalizeSource(lead.page_from);
      sources[src] = (sources[src] || 0) + 1;
    });

    const allOptions = Object.keys(sources).sort((a, b) => a.localeCompare(b));
    setSourceOptions(allOptions);

    const sourceArr = Object.keys(sources)
      .map(k => ({ name: k, value: sources[k] }))
      .sort((a, b) => b.value - a.value);

    const TOP_N = 6;
    const top = sourceArr.slice(0, TOP_N);
    const rest = sourceArr.slice(TOP_N);
    const otherValue = rest.reduce((sum, x) => sum + x.value, 0);
    const chartData = otherValue > 0 ? [...top, { name: 'Other', value: otherValue }] : top;

    setSourceData(chartData.length ? chartData : [{ name: 'Unknown', value: 1 }]);

    const totalLeads = data.length || 1;
    const topList = sourceArr.slice(0, 12).map(x => ({
      ...x,
      pct: Math.round((x.value / totalLeads) * 100)
    }));
    setSourceSummary(topList);
  };

  const handleUpdateLead = async () => {
    if (!selectedLead) return;
    try {
      const updates = { admin_notes: noteText, status: statusUpdate };

      const { error } = await supabase
        .from('leads')
        .update(updates)
        .eq('id', selectedLead.id);

      if (error) throw error;

      toast({ title: "Lead updated successfully" });

      const updatedLeads = leads.map(l =>
        l.id === selectedLead.id ? { ...l, ...updates } : l
      );
      setLeads(updatedLeads);
      calculateAnalytics(updatedLeads);
      setIsDialogOpen(false);
    } catch (err) {
      toast({ variant: "destructive", title: "Update failed" });
    }
  };

  const openEditDialog = (lead) => {
    setSelectedLead(lead);
    setNoteText(lead.admin_notes || '');
    setStatusUpdate(lead.status || 'New');
    setIsDialogOpen(true);
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.user_name || '').toLowerCase().includes(searchLower) ||
      (lead.phone_number || '').toLowerCase().includes(searchLower) ||
      (lead.email || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;

    const leadSrc = normalizeSource(lead.page_from);
    const matchesSource = sourceFilter === 'all' || leadSrc === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  }).sort((a, b) => {
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportCSV = () => {
    const headers = ['ID', 'Date', 'Name', 'Phone', 'Email', 'City', 'Course', 'Source', 'Status', 'Notes'];
    const rows = filteredLeads.map(l => [
      l.id,
      format(new Date(l.created_at), 'yyyy-MM-dd HH:mm'),
      `"${l.user_name}"`,
      `"${l.phone_number}"`,
      l.email,
      `"${l.city || ''}"`,
      `"${l.course_of_interest || ''}"`,
      normalizeSource(l.page_from),
      l.status,
      `"${l.admin_notes || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b'];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-gray-500">Loading leads data...</p>
      </div>
    </div>
  );

  const donutData = sourceData?.length ? sourceData : [{ name: 'Unknown', value: 1 }];

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Lead Management</h1>
          <p className="text-gray-500 mt-1">Track, manage, and analyze your student enquiries.</p>
        </div>
        <Button onClick={exportCSV} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* --- Analytics Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600/80 uppercase">Total Leads</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-full text-blue-600"><BookOpen className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-purple-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-600/80 uppercase">Today's Leads</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.today}</h3>
          </div>
          <div className="p-3 bg-purple-50 rounded-full text-purple-600"><Clock className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-amber-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-600/80 uppercase">In Progress</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.ongoing}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-full text-amber-600"><AlertCircle className="h-6 w-6" /></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-600/80 uppercase">Closed / Converted</p>
            <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.closed}</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-full text-green-600"><CheckCircle className="h-6 w-6" /></div>
        </div>
      </div>

      {/* --- Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h4 className="text-lg font-bold text-gray-800 mb-4">Daily Lead Trend (Last 7 Days)</h4>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ✅ Lead Source (Donut FIXED - stable) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h4 className="text-lg font-bold text-gray-800">Lead Source</h4>
              <p className="text-xs text-gray-500 mt-1">Click any source to filter</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setSourceFilter('all')} className="h-9">
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* ✅ Donut (center + complete circle + small) */}
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}      // ✅ smaller ring
                    outerRadius={82}      // ✅ smaller ring
                    startAngle={90}
                    endAngle={-270}       // ✅ full 360 circle
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="#ffffff"
                    strokeWidth={2}
                    onClick={(dp) => {
                      if (!dp?.name) return;
                      if (dp.name === 'Other') return;
                      setSourceFilter(dp.name);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}

                    <Label
                      position="center"
                      content={() => (
                        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                          <tspan x="50%" dy="-6" fontSize="18" fontWeight="700" fill="#111827">
                            {stats.total}
                          </tspan>
                          <tspan x="50%" dy="18" fontSize="12" fill="#6B7280">
                            Total Leads
                          </tspan>
                        </text>
                      )}
                    />
                  </Pie>

                  <Tooltip content={<CustomSourceTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top Sources List */}
            <div className="space-y-2">
              {(topSourcesExpanded ? sourceSummary : sourceSummary.slice(0, 6)).map((s, idx) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSourceFilter(s.name)}
                  className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition
                    ${sourceFilter === s.name ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: COLORS[idx % COLORS.length] }}
                    />
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {prettySourceName(s.name)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-500">{s.pct}%</span>
                    <span className="text-sm font-semibold text-gray-900">{s.value}</span>
                  </div>
                </button>
              ))}

              {sourceSummary.length > 6 && (
                <button
                  type="button"
                  onClick={() => setTopSourcesExpanded(v => !v)}
                  className="w-full text-xs text-blue-600 hover:underline text-left mt-1"
                >
                  {topSourcesExpanded ? 'Show less' : `Show more (${sourceSummary.length - 6} more)`}
                </button>
              )}
            </div>
          </div>

          {sourceFilter !== 'all' && (
            <div className="mt-3 text-xs text-gray-600">
              Filter applied: <span className="font-semibold text-gray-900">{prettySourceName(sourceFilter)}</span>
            </div>
          )}
        </div>
      </div>

      {/* --- Lead List --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row gap-4 justify-between bg-gray-50/50">
          <div className="flex flex-1 gap-2 items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="Search name, phone, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />

              <select
                className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none cursor-pointer hover:border-blue-300 transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="New">New</option>
                <option value="In Progress">In Progress</option>
                <option value="Closed">Closed</option>
              </select>

              <select
                className="bg-white border border-gray-200 rounded-lg text-sm px-3 py-2 outline-none cursor-pointer hover:border-blue-300 transition-all"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
              >
                <option value="all">All Sources</option>
                {sourceOptions.map(src => (
                  <option key={src} value={src}>{prettySourceName(src)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-lg hover:bg-white transition-all"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Contact</th>
                <th className="px-6 py-4 font-medium">Interest</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((lead) => {
                  const cleanSource = normalizeSource(lead.page_from);
                  return (
                    <tr key={lead.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{lead.user_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span title={lead.page_from || ''}>{prettySourceName(cleanSource)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-3 w-3" /> {lead.phone_number}
                          </div>
                          {lead.email && (
                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                              <Mail className="h-3 w-3" /> {lead.email}
                            </div>
                          )}
                          {lead.city && (
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <MapPin className="h-3 w-3" /> {lead.city}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-900 font-medium">{lead.course_of_interest || 'N/A'}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[150px]" title={lead.preferred_colleges}>
                          {lead.preferred_colleges}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                          ${lead.status === 'New' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            lead.status === 'In Progress' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-green-50 text-green-700 border-green-200'}`}>
                          {lead.status || 'New'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(lead.created_at), 'MMM dd, HH:mm')}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(lead)}>
                          Edit
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{paginatedLeads.length}</span> of <span className="font-medium">{filteredLeads.length}</span> results
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ✅ Update Lead Dialog - (same fixed UI) */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedLead(null);
            setNoteText('');
            setStatusUpdate('New');
          }
        }}
      >
        <DialogContent className="z-50 w-[95vw] max-w-[540px] max-h-[85vh] overflow-hidden p-0">
          <div className="p-5 border-b bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg">Update Lead</DialogTitle>
              <DialogDescription className="text-sm">
                Managing lead:{' '}
                <span className="font-semibold text-gray-900">
                  {selectedLead?.user_name || '—'}
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateLead();
            }}
            className="bg-white"
          >
            <div className="p-5 overflow-y-auto max-h-[calc(85vh-150px)] space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Status</label>
                <select
                  className="w-full h-11 px-3 border border-gray-200 rounded-lg bg-white text-sm outline-none
                             focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                >
                  <option value="New">New</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800">Admin Notes</label>
                <Textarea
                  placeholder="Add internal notes about this lead..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="min-h-[140px] border-gray-200 rounded-lg focus-visible:ring-blue-500/20"
                />
              </div>

              {selectedLead?.message && (
                <div className="border border-gray-200 bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                  <div className="font-semibold text-gray-900 mb-1">Student Message</div>
                  <div className="whitespace-pre-wrap">{selectedLead.message}</div>
                </div>
              )}
            </div>

            <div className="p-5 border-t bg-white flex flex-col sm:flex-row gap-2 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-11">
                Cancel
              </Button>
              <Button type="submit" className="h-11">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
