import { useAuditLogs } from "../../lib/api";
import { History, Search } from "lucide-react";
import { useState } from "react";

export function AuditLogsTab() {
  const { data: logs, isLoading } = useAuditLogs();
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return <div className="text-sm text-text-muted animate-pulse">Loading audit logs...</div>;
  }

  const filteredLogs = logs?.filter(log => 
    log.setting.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.changedBy.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-display font-bold text-text-primary mb-1">Audit Logs</h3>
          <p className="text-sm text-text-secondary">Track configuration changes across the platform.</p>
        </div>
        <div className="relative w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><Search size={14} /></span>
          <input 
            type="text" 
            placeholder="Search settings or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Timestamp</th>
              <th className="px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Setting Changed</th>
              <th className="px-4 py-3 font-semibold text-text-secondary text-xs uppercase">User</th>
              <th className="px-4 py-3 font-semibold text-text-secondary text-xs uppercase">Old Value</th>
              <th className="px-4 py-3 font-semibold text-text-secondary text-xs uppercase">New Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted italic">No logs found</td>
              </tr>
            ) : filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-xs whitespace-nowrap text-text-secondary">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3 font-medium">{log.setting}</td>
                <td className="px-4 py-3 text-text-secondary">{log.changedBy}</td>
                <td className="px-4 py-3 text-text-muted line-through">{log.oldValue}</td>
                <td className="px-4 py-3 text-success font-medium">{log.newValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
