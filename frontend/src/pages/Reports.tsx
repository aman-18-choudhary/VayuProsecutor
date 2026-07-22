import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useReports, 
  useExportReportPDF, 
  useExportReportDOCX, 
  useExportReportCSV, 
  useShareReport, 
  useDeleteReport 
} from "../lib/api";
import { Card, Badge, Skeleton } from "../components/ui";
import { CreateReportModal } from "../components/reports/CreateReportModal";
import type { City, Report } from "../lib/types";
import {
  FileText, Download, Plus, Calendar, Clock, User, Activity,
  AlertTriangle, MapPin, CheckCircle2, FileJson, Printer, Share2, Pin, Trash2, Search, Filter, FileCode2, Zap
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import toast from "react-hot-toast";

dayjs.extend(relativeTime);

export function Reports({ city }: { city: City }) {
  const { data: reports, isLoading, refetch } = useReports();
  const exportPDFMutation = useExportReportPDF();
  const exportDOCXMutation = useExportReportDOCX();
  const exportCSVMutation = useExportReportCSV();
  const shareMutation = useShareReport();
  const deleteMutation = useDeleteReport();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [pinnedReports, setPinnedReports] = useState<Set<string>>(new Set());

  const handleExport = async (report_id: string, format: string, title: string) => {
    try {
      let blob;
      if (format === 'pdf') {
        blob = await exportPDFMutation.mutateAsync(report_id);
      } else if (format === 'docx') {
        blob = await exportDOCXMutation.mutateAsync(report_id);
      } else if (format === 'csv') {
        blob = await exportCSVMutation.mutateAsync(report_id);
      }
      
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success(`Exported ${format.toUpperCase()} successfully`);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Failed to export ${format.toUpperCase()}`);
    }
  };

  const handleShare = async (report_id: string) => {
    try {
      const res = await shareMutation.mutateAsync(report_id);
      navigator.clipboard.writeText(res.url);
      toast.success("Share link copied to clipboard");
    } catch (e) {
      toast.error("Failed to generate share link");
    }
  };

  const handleDelete = async (report_id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteMutation.mutateAsync(report_id);
      if (selectedReport?.id === report_id) setSelectedReport(null);
      toast.success("Report deleted");
    } catch (e) {
      toast.error("Failed to delete report");
    }
  };

  const togglePin = (report_id: string) => {
    const next = new Set(pinnedReports);
    if (next.has(report_id)) next.delete(report_id);
    else next.add(report_id);
    setPinnedReports(next);
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredReports = useMemo(() => {
    return (reports || [])
      .filter(r => r.city === city.name)
      .filter(r => typeFilter === "All" || r.type === typeFilter)
      .filter(r => !pinnedOnly || pinnedReports.has(r.id))
      .filter(r => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.type.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [reports, city.name, typeFilter, pinnedOnly, pinnedReports, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
      >
        <div>
          <h2 className="font-display text-2xl font-extrabold text-text-primary">
            📑 Environmental Reports
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Generate, view, and export intelligence briefings for{" "}
            <span className="font-semibold text-text-primary">{city.name}</span>.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus size={16} />
          New Report
        </button>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 print:block">
        {/* Main List */}
        <div className="xl:col-span-8 space-y-4 print:hidden">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 p-3 bg-white border border-border rounded-2xl shadow-sm">
             <div className="relative flex-1">
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
               <input 
                 type="text" 
                 placeholder="Search reports by title or type..."
                 className="w-full pl-9 pr-3 py-2 bg-bg-muted rounded-xl text-sm border-none focus:ring-2 focus:ring-primary/20"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
               />
             </div>
             <div className="flex gap-2">
               <select 
                 className="px-3 py-2 bg-bg-muted rounded-xl text-sm border-none focus:ring-2 focus:ring-primary/20"
                 value={typeFilter}
                 onChange={(e) => setTypeFilter(e.target.value)}
               >
                 <option value="All">All Types</option>
                 <option value="Executive Summary">Executive Summary</option>
                 <option value="Daily AQI Report">Daily AQI Report</option>
               </select>
               <button 
                 onClick={() => setPinnedOnly(!pinnedOnly)}
                 className={`px-3 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors ${pinnedOnly ? 'bg-primary text-white' : 'bg-bg-muted text-text-secondary hover:text-text-primary'}`}
               >
                 <Pin size={14} /> Pinned
               </button>
             </div>
          </div>
          
          {isLoading ? (
            <Card className="p-6">
              <Skeleton className="h-40" />
            </Card>
          ) : filteredReports.length === 0 ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <FileText size={48} className="text-text-muted mb-4 opacity-50" />
              <h3 className="text-lg font-bold text-text-primary">No Reports Found</h3>
              <p className="text-sm text-text-secondary max-w-sm mt-2">
                There are currently no environmental reports matching your criteria.
              </p>
            </Card>
          ) : (
            <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg-muted/50 border-b border-border">
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Report</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredReports.map((report) => (
                    <tr 
                      key={report.id} 
                      className={`hover:bg-bg-muted/30 cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'bg-primary/5' : ''}`}
                      onClick={() => setSelectedReport(report)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={(e) => { e.stopPropagation(); togglePin(report.id); }} className={`p-1.5 rounded-md ${pinnedReports.has(report.id) ? 'text-primary' : 'text-text-muted opacity-30 hover:opacity-100 hover:text-primary'}`}>
                            <Pin size={14} fill={pinnedReports.has(report.id) ? 'currentColor' : 'none'} />
                          </button>
                          <div>
                            <p className="font-bold text-sm text-text-primary">{report.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[11px] text-text-muted flex items-center gap-1">
                                <User size={10} /> {report.author}
                              </span>
                              <span className="text-[11px] text-text-muted flex items-center gap-1">
                                • {report.size}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-text-secondary">
                            {dayjs(report.generated_at).format('MMM D, YYYY')}
                          </span>
                          <span className="text-[11px] text-text-muted flex items-center gap-1 mt-0.5">
                            <Clock size={10} /> {dayjs(report.generated_at).fromNow()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" size="sm">{report.type}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleExport(report.id, 'pdf', report.title); }}
                          className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex"
                          title="Download PDF"
                        >
                          <Download size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="xl:col-span-4 print:col-span-12">
          <AnimatePresence mode="wait">
            {selectedReport ? (
              <motion.div
                key={selectedReport.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="print:w-full print:m-0 print:p-0"
              >
                <Card className="p-0 overflow-hidden sticky top-6 print:shadow-none print:border-none print:bg-transparent" hover={false}>
                  {/* Actions Header (hidden when printing) */}
                  <div className="p-4 border-b border-border bg-bg-muted/30 flex justify-between items-center print:hidden flex-wrap gap-2">
                     <div className="flex items-center gap-2">
                       <Badge variant="success" size="sm" className="flex items-center gap-1">
                         <CheckCircle2 size={12} /> {selectedReport.status}
                       </Badge>
                     </div>
                     <div className="flex gap-1">
                       <button onClick={() => togglePin(selectedReport.id)} className="p-2 text-text-muted hover:text-primary bg-white border border-border rounded-lg shadow-sm" title={pinnedReports.has(selectedReport.id) ? "Unpin" : "Pin"}>
                         <Pin size={14} fill={pinnedReports.has(selectedReport.id) ? 'currentColor' : 'none'} />
                       </button>
                       <button onClick={handlePrint} className="p-2 text-text-muted hover:text-primary bg-white border border-border rounded-lg shadow-sm" title="Print Report">
                         <Printer size={14} />
                       </button>
                       <button onClick={() => handleShare(selectedReport.id)} className="p-2 text-text-muted hover:text-primary bg-white border border-border rounded-lg shadow-sm" title="Share Link">
                         <Share2 size={14} />
                       </button>
                       
                       <div className="w-px bg-border mx-1"></div>
                       
                       <button onClick={() => handleExport(selectedReport.id, 'csv', selectedReport.title)} className="p-2 text-text-muted hover:text-primary bg-white border border-border rounded-lg shadow-sm flex items-center gap-1" title="Export CSV">
                         <FileText size={14} /> <span className="text-[10px] font-bold">CSV</span>
                       </button>
                       <button onClick={() => handleExport(selectedReport.id, 'docx', selectedReport.title)} className="p-2 text-text-muted hover:text-primary bg-white border border-border rounded-lg shadow-sm flex items-center gap-1" title="Export DOCX">
                         <FileCode2 size={14} /> <span className="text-[10px] font-bold">DOCX</span>
                       </button>
                       <button onClick={() => handleExport(selectedReport.id, 'pdf', selectedReport.title)} className="p-2 text-white hover:bg-primary/90 bg-primary rounded-lg shadow-sm flex items-center gap-1" title="Download PDF">
                         <Download size={14} /> <span className="text-[10px] font-bold">PDF</span>
                       </button>
                       
                       <div className="w-px bg-border mx-1"></div>
                       <button onClick={() => handleDelete(selectedReport.id)} className="p-2 text-danger hover:bg-danger/10 border border-transparent rounded-lg transition-colors" title="Delete Report">
                         <Trash2 size={14} />
                       </button>
                     </div>
                  </div>
                  
                  {/* Report Content */}
                  <div className="p-8 space-y-8 max-h-[800px] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 bg-white">
                    {/* Cover Section */}
                    <div className="text-center border-b border-border pb-8">
                       <div className="w-16 h-16 bg-bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                         <Activity size={32} className="text-primary" />
                       </div>
                       <h2 className="font-display font-black text-2xl text-text-primary mb-2">
                         {selectedReport.title}
                       </h2>
                       <p className="text-sm font-semibold text-text-secondary uppercase tracking-widest mb-4">
                         {selectedReport.city} • {selectedReport.type}
                       </p>
                       <div className="flex items-center justify-center gap-4 text-xs font-mono text-text-muted">
                         <span>ID: {selectedReport.id}</span>
                         <span>•</span>
                         <span>Generated: {dayjs(selectedReport.generated_at).format('YYYY-MM-DD HH:mm')}</span>
                         <span>•</span>
                         <span>Author: {selectedReport.author}</span>
                       </div>
                    </div>
                  
                    {/* Executive Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-border pb-2">
                        <Activity size={14} /> Executive Summary
                      </h4>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {selectedReport.executive_summary}
                      </p>
                    </div>

                    {/* Situation Overview */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border border-border bg-bg-muted/30">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Average AQI</p>
                        <p className="text-2xl font-extrabold text-text-primary">{selectedReport.current_situation.aqi}</p>
                      </div>
                      <div className="p-4 rounded-xl border border-border bg-bg-muted/30">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Active Alerts</p>
                        <p className="text-2xl font-extrabold text-danger">{selectedReport.active_alerts_summary.total}</p>
                      </div>
                    </div>

                    {/* Source Attribution (if available) */}
                    {selectedReport.source_attribution && selectedReport.source_attribution.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-border pb-2">
                          <Activity size={14} /> Source Attribution
                        </h4>
                        <div className="space-y-2">
                          {selectedReport.source_attribution.map((src: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center p-2 text-sm border-b border-border/50">
                              <span className="font-semibold text-text-primary">{src.name}</span>
                              <span className="text-text-muted">{src.contribution}% Contribution</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Insights */}
                    {selectedReport.insights.length > 0 && (
                      <div className="break-inside-avoid">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-border pb-2">
                          <AlertTriangle size={14} /> AI Insights & Recommendations
                        </h4>
                        <ul className="space-y-3">
                          {selectedReport.insights.map((insight, idx) => (
                            <li key={idx} className="text-sm text-text-secondary flex gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
                              <span className="text-primary mt-0.5"><Zap size={14}/></span> 
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Ward Intelligence */}
                    {selectedReport.ward_intelligence.length > 0 && (
                      <div className="break-inside-avoid">
                        <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-border pb-2">
                          <MapPin size={14} /> Ward Highlights
                        </h4>
                        <div className="space-y-2">
                          {selectedReport.ward_intelligence.map((ward, idx) => (
                            <div key={idx} className="flex justify-between items-center p-3 rounded-lg border border-border text-sm">
                              <span className="font-bold text-text-primary w-1/3">{ward.name}</span>
                              <span className="text-text-secondary w-1/3 text-center">{ward.primary_issue}</span>
                              <Badge variant="outline" size="xs" className="w-1/4 justify-center">Risk: {ward.risk_index} | AQI: {ward.aqi}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="pt-8 text-center text-[10px] text-text-muted font-mono uppercase tracking-widest mt-12 border-t border-border">
                       CONFIDENTIAL • SMART CITY ENVIRONMENTAL COMMAND CENTER • VAYUPROSECUTOR
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full print:hidden"
              >
                <Card className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-6 bg-bg-muted/30 border-dashed">
                  <FileText size={40} className="text-text-muted opacity-30 mb-4" />
                  <p className="text-sm font-semibold text-text-primary">Select a report to preview</p>
                  <p className="text-xs text-text-secondary mt-1">Click any report in the table to view its details and export options.</p>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <CreateReportModal
        city={city}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerated={() => refetch()}
      />
    </div>
  );
}
