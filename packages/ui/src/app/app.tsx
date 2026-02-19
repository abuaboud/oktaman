import { createBrowserRouter, RouterProvider, redirect, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './routes/home';
import SessionsPage from './routes/sessions';
import ConnectionsPage from './routes/connections';
import AgentBoardPage from './routes/agent-board';
import SettingsPage from './routes/settings';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Suspense, useEffect } from 'react';
import { ThemeProvider } from '@/app/components/theme-provider';
import { Toaster, toast } from 'sonner';
import { SocketProvider } from '@/components/socket-provider';
import { settingsHooks } from '@/lib/hooks/settings-hooks';

const queryClient = new QueryClient();

function RootLayout() {
  const { data: validation } = settingsHooks.useValidation();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (validation && !validation.isValid && location.pathname !== '/settings') {
      toast.error('OpenRouter API key required. Please configure your settings.');
      navigate('/settings');
    }
  }, [validation, location.pathname, navigate]);

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />
      },
      {
        path: "/sessions",
        element: <SessionsPage />
      },
      {
        path: "/sessions/:sessionId",
        element: <SessionsPage />
      },
      {
        path: "/connections",
        element: <ConnectionsPage />
      },
      {
        path: "/settings",
        element: <SettingsPage />
      },
      {
        path: "/agents/:agentId",
        element: <AgentBoardPage />
      },
      {
        path: "*",
        loader: () => redirect("/")
      }
    ]
  }
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" >
        <SocketProvider>
          <Toaster />
          <TooltipProvider>
            <Suspense fallback={<div></div>}>
              <RouterProvider router={router} />
            </Suspense>
          </TooltipProvider>
        </SocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
