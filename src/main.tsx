// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from "./App";
import AdminPage from "./components/admin/AdminPage";

Amplify.configure(outputs);

// Configure React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes
      gcTime: 10 * 60 * 1000, // Cache persists for 10 minutes (previously cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: false, // Don't refetch on window focus (can enable later)
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Admin route - no authentication required */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Main app routes - require authentication */}
          <Route path="/*" element={
            <Authenticator>
              {({ signOut, user }) => (
                <App signOut={signOut} user={user} />
              )}
            </Authenticator>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);