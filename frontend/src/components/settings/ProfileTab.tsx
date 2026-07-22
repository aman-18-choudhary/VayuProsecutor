import { useState } from "react";
import { UserProfile } from "../../lib/types";
import { useUpdateUserProfile } from "../../lib/api";
import { GradientButton } from "../ui";
import { User, Mail, Briefcase, Building } from "lucide-react";
import toast from "react-hot-toast";

export function ProfileTab({ profile }: { profile: UserProfile }) {
  const [formData, setFormData] = useState(profile);
  const { mutate: updateProfile, isPending } = useUpdateUserProfile();

  const handleSave = () => {
    updateProfile(formData, {
      onSuccess: () => toast.success("Profile updated successfully"),
      onError: () => toast.error("Failed to update profile")
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-6 mb-8">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border shadow-sm">
          <img src={formData.profilePicture} alt={formData.name} className="h-full w-full object-cover" />
        </div>
        <div>
          <h3 className="font-display text-xl font-bold text-text-primary">{formData.name}</h3>
          <p className="text-sm text-text-secondary">ID: {formData.userId}</p>
          <p className="text-xs text-text-muted mt-1">Last Login: {new Date(formData.lastLogin).toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Full Name</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><User size={16} /></span>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Email</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><Mail size={16} /></span>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Role</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><Briefcase size={16} /></span>
            <input 
              type="text" 
              value={formData.role}
              onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-text-secondary uppercase mb-1 block">Organization</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"><Building size={16} /></span>
            <input 
              type="text" 
              value={formData.organization}
              onChange={(e) => setFormData(p => ({ ...p, organization: e.target.value }))}
              className="w-full rounded-lg border border-border bg-bg-primary py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border flex justify-end">
        <GradientButton size="md" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Profile"}
        </GradientButton>
      </div>
    </div>
  );
}
