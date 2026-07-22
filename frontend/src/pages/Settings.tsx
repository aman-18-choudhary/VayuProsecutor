import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, Building2, Database, BrainCircuit, Bell, 
  Target, Sliders, Activity, HardDrive, ShieldCheck, 
  History, DownloadCloud 
} from "lucide-react";
import { MotionCard } from "../components/ui";
import { useSettings, useUserProfile } from "../lib/api";

import { ProfileTab } from "../components/settings/ProfileTab";
import { CityConfigTab } from "../components/settings/CityConfigTab";
import { DataSourcesTab } from "../components/settings/DataSourcesTab";
import { AIConfigTab } from "../components/settings/AIConfigTab";
import { NotificationsTab } from "../components/settings/NotificationsTab";
import { AlertThresholdsTab } from "../components/settings/AlertThresholdsTab";
import { PreferencesTab } from "../components/settings/PreferencesTab";
import { SystemHealthTab } from "../components/settings/SystemHealthTab";
import { CacheManagementTab } from "../components/settings/CacheManagementTab";
import { SecurityTab } from "../components/settings/SecurityTab";
import { AuditLogsTab } from "../components/settings/AuditLogsTab";
import { ExportBackupTab } from "../components/settings/ExportBackupTab";

const SETTINGS_TABS = [
  { id: "profile", label: "User Profile", icon: <User size={18} /> },
  { id: "city", label: "City Configuration", icon: <Building2 size={18} /> },
  { id: "data", label: "Data Sources", icon: <Database size={18} /> },
  { id: "ai", label: "AI Configuration", icon: <BrainCircuit size={18} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={18} /> },
  { id: "thresholds", label: "Alert Thresholds", icon: <Target size={18} /> },
  { id: "preferences", label: "Dashboard Preferences", icon: <Sliders size={18} /> },
  { id: "health", label: "System Health", icon: <Activity size={18} /> },
  { id: "cache", label: "Cache Management", icon: <HardDrive size={18} /> },
  { id: "security", label: "Security", icon: <ShieldCheck size={18} /> },
  { id: "audit", label: "Audit Logs", icon: <History size={18} /> },
  { id: "backup", label: "Export / Backup", icon: <DownloadCloud size={18} /> },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const { data: profile, isLoading: profileLoading } = useUserProfile();

  if (settingsLoading || profileLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-text-muted animate-pulse">Loading settings...</div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "profile": return <ProfileTab profile={profile!} />;
      case "city": return <CityConfigTab settings={settings!} />;
      case "data": return <DataSourcesTab />;
      case "ai": return <AIConfigTab settings={settings!} />;
      case "notifications": return <NotificationsTab settings={settings!} />;
      case "thresholds": return <AlertThresholdsTab settings={settings!} />;
      case "preferences": return <PreferencesTab settings={settings!} />;
      case "health": return <SystemHealthTab />;
      case "cache": return <CacheManagementTab />;
      case "security": return <SecurityTab />;
      case "audit": return <AuditLogsTab />;
      case "backup": return <ExportBackupTab />;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6">
      {/* Settings Sidebar */}
      <MotionCard delay={0.1} className="w-64 shrink-0 overflow-y-auto">
        <div className="mb-4">
          <h2 className="font-display text-lg font-bold text-text-primary">Settings</h2>
          <p className="text-xs text-text-secondary">Platform Configuration</p>
        </div>
        <nav className="flex flex-col gap-1">
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-text-secondary hover:bg-bg-muted hover:text-text-primary"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </MotionCard>

      {/* Main Content Area */}
      <MotionCard delay={0.15} className="flex-1 overflow-y-auto">
        {renderTab()}
      </MotionCard>
    </div>
  );
}
