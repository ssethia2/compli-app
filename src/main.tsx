// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter } from 'react-router-dom';
import App from "./App";

Amplify.configure(outputs);

// Simple main file without complex state management
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Authenticator>
        {({ signOut, user }) => (
          <App signOut={signOut} user={user} />
        )}
      </Authenticator>
    </BrowserRouter>
  </React.StrictMode>
);