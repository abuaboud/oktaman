import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/app/components/app-sidebar';
import { Header } from '@/app/components/header';
import { settingsHooks } from '@/lib/hooks/settings-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Terminal, Bot, Globe, Plug, Radio } from 'lucide-react';

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

  const telegramChannel = settings.channels.find(c => c.type === 'TELEGRAM');

  return (
    <SidebarProvider className="h-screen" defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-full overflow-hidden bg-sidebar">
        <div className="flex-1 flex flex-col pl-2 pr-4 pt-4 pb-2 overflow-hidden">
          <div className="flex flex-col h-full bg-background rounded-xl shadow-sm border overflow-hidden">
            <Header title="Settings" />
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">

                {/* CLI Banner */}
                <Card className="border-2 border-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                      <Terminal className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        Run <code className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 font-mono text-xs">oktaman setup</code> in your terminal to configure settings
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        The interactive CLI wizard guides you through provider, tools, and channel setup.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI Provider — read-only */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
                          <Bot className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">AI Provider</CardTitle>
                          <CardDescription>Model configuration for chat and embeddings</CardDescription>
                        </div>
                      </div>
                      {settings.provider ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Configured</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">Not configured</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Provider</span>
                        <p className="font-medium capitalize">{settings.provider?.type ?? '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">API Key</span>
                        <p className="font-medium font-mono">{maskKey(settings.provider?.apiKey)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Chat Model</span>
                        <p className="font-medium">{settings.defaultModelId || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Embedding Model</span>
                        <p className="font-medium">{settings.embeddingModelId || '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tools — read-only */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                          <Globe className="h-5 w-5 text-orange-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Tools</CardTitle>
                          <CardDescription>Web scraping and external integrations</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Optional</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Firecrawl</span>
                          <p className="font-medium">{settings.firecrawlApiKey ? 'Configured' : 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Plug className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Composio</span>
                          <p className="font-medium">{settings.composioApiKey ? 'Configured' : 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Channels — read-only */}
                <Card className="border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                          <Radio className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">Channels</CardTitle>
                          <CardDescription>Connected messaging platforms</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">Optional</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-medium">Telegram</h4>
                            <p className="text-xs text-muted-foreground">
                              {telegramChannel ? 'Connected' : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        {telegramChannel ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Connected</Badge>
                        ) : (
                          <Badge variant="outline">Not connected</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function maskKey(key: string | undefined | null): string {
  if (!key) return '—';
  if (key.length <= 4) return '****';
  return '****' + key.slice(-4);
}
