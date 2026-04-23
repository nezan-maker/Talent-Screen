"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Bell, Lock, Users, Zap, Code, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-10">
      <PageHeader title="Settings" subtitle="Manage your project preferences and configuration." backHref="/dashboard" />

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Workspace Settings */}
        <Card>
          <CardHeader 
            title="Workspace" 
            subtitle="Branding and environment configuration." 
            icon={Zap}
          />
          <CardBody>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-3">Workspace Name</label>
                <input 
                  type="text" 
                  defaultValue="RankWise" 
                  className="w-full rounded-input border border-border bg-bg px-4 py-3 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text-primary mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="info">Mock API</Badge>
                  <Badge variant="default">Redux Toolkit</Badge>
                  <Badge variant="default">Next.js 15</Badge>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-text-muted">
                  Active workspace with demo data. Configure real settings when backend is available.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader 
            title="Notifications" 
            subtitle="Manage how you receive updates." 
            icon={Bell}
          />
          <CardBody>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary text-sm">Email Notifications</p>
                  <p className="text-xs text-text-muted mt-1">Get updates about screening results</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-accent relative cursor-pointer">
                  <div className="absolute right-1 top-1 h-5 w-5 rounded-full bg-white" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-text-primary text-sm">Push Notifications</p>
                  <p className="text-xs text-text-muted mt-1">Real-time alerts for important events</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-border relative cursor-pointer">
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-border" />
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  All notifications are sent via React Hot Toast.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader 
            title="Security" 
            subtitle="Manage your security settings." 
            icon={Lock}
          />
          <CardBody>
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <p className="font-semibold text-text-primary text-sm">Two-Factor Authentication</p>
                  <p className="text-xs text-text-muted mt-1">Add extra security to your account</p>
                </div>
                <Badge variant="info">Not Enabled</Badge>
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm mb-3">Last Login</p>
                <p className="text-sm text-text-muted">Today at 10:30 AM</p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  Enterprise security features available on premium plans.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Team Management */}
        <Card>
          <CardHeader 
            title="Team" 
            subtitle="Manage team members and permissions." 
            icon={Users}
          />
          <CardBody>
            <div className="space-y-6">
              <div className="pb-4 border-b border-border">
                <p className="font-semibold text-text-primary text-sm mb-2">Team Members</p>
                <p className="text-sm text-text-muted">You (Owner)</p>
              </div>
              <div>
                <p className="font-semibold text-text-primary text-sm mb-3">Invite Team Member</p>
                <input 
                  type="email" 
                  placeholder="colleague@company.com" 
                  className="w-full rounded-input border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  Team collaboration features available on higher plans.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* API & Integrations */}
        <Card>
          <CardHeader 
            title="API & Integrations" 
            subtitle="Manage API keys and integrations." 
            icon={Code}
          />
          <CardBody>
            <div className="space-y-6">
              <div>
                <p className="font-semibold text-text-primary text-sm mb-2">API Key</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="password" 
                    value="••••••••••••••••" 
                    readOnly
                    className="flex-1 rounded-input border border-border bg-bg px-4 py-2.5 text-sm text-text-primary"
                  />
                  <button className="px-3 py-2 rounded-input border border-border hover:bg-bg transition-colors text-sm font-medium text-text-primary">
                    Reveal
                  </button>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-text-muted">
                  Use your API key to integrate with third-party services.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Data & Storage */}
        <Card>
          <CardHeader 
            title="Data & Storage" 
            subtitle="Manage your data and storage usage." 
            icon={Database}
          />
          <CardBody>
            <div className="space-y-6">
              <div>
                <p className="font-semibold text-text-primary text-sm mb-3">Storage Usage</p>
                <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-accent rounded-full" />
                </div>
                <p className="text-xs text-text-muted mt-2">250 MB of 1 GB used</p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="font-semibold text-text-primary text-sm mb-2">Retention Policy</p>
                <p className="text-sm text-text-muted">
                  Screening results retained for 90 days
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Additional Settings Section */}
      <Card className="bg-accent/5 border-accent/20">
        <CardHeader 
          title="Account & Preferences" 
          subtitle="Manage your account settings and preferences."
        />
        <CardBody>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Language</label>
              <select className="w-full rounded-input border border-border bg-bg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Spanish</option>
                <option>French</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">Time Zone</label>
              <select className="w-full rounded-input border border-border bg-bg px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all">
                <option>Pacific Time (PT)</option>
                <option>Eastern Time (ET)</option>
                <option>Central European Time</option>
              </select>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-text-muted">
              Your preferences are automatically saved to your account.
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader 
          title="Danger Zone" 
          subtitle="Irreversible actions"
        />
        <CardBody>
          <p className="text-sm text-text-muted mb-6">
            These actions cannot be undone. Please be careful.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button className="px-4 py-2.5 rounded-input border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors font-medium text-sm">
              Export Data
            </button>
            <button className="px-4 py-2.5 rounded-input border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors font-medium text-sm">
              Delete Account
            </button>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
