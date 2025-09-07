// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from "./App";
import AdminPage from "./components/admin/AdminPage";

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
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
  </React.StrictMode>
);