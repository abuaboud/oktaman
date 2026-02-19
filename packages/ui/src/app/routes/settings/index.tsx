import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/app-sidebar';
import { Header } from '@/app/components/header';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { LlmSection } from './llm-section';
import { ToolsSection } from './tools-section';
import { ChannelsSection } from './channels-section';

export default function SettingsPage() {
  const { data: settings, isLoading } = settingsHooks.useSettings();

  if (isLoading || !settings) {
    return (
      <SidebarProvider className="h-screen" defaultOpen={true}>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
          <div className="flex-1 flex flex-col pl-2 pr-4 pt-4 pb-2 overflow-hidden">
            <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
              <Header title="Settings" />
              <div className="flex-1 flex items-center justify-center">
                <div className="text-muted-foreground">Loading settings...</div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider className="h-screen" defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 flex flex-col pl-2 pr-4 pt-4 pb-2 overflow-hidden">
          <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
            <Header title="Settings" />
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <LlmSection settings={settings} />
                <ToolsSection settings={settings} />
                <ChannelsSection settings={settings} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
