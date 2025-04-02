import React from "react";
import ReactDOM from "react-dom/client";
import { Authenticator } from '@aws-amplify/ui-react';
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";
import '@aws-amplify/ui-react/styles.css';
import { BrowserRouter } from 'react-router-dom';
import { RoleProvider } from "./context/RoleContext";
import AuthRoutes from "./components/AuthRoutes";

Amplify.configure(outputs);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RoleProvider>
        <Authenticator>
          <AuthRoutes />
        </Authenticator>
      </RoleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
