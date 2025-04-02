import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Schema } from "../amplify/data/resource";
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from "aws-amplify/data";
import { useRole } from "./context/RoleContext";
import "./App.css";

const client = generateClient<Schema>();

function App() {
  const { user, signOut } = useAuthenticator();
  const { userRole, isDirector, isProfessional } = useRole();
  const navigate = useNavigate();
  
  const [todos, setTodos] = useState<Array<Schema["Todo"]["type"]>>([]);

  useEffect(() => {
    // If no role selected, redirect to role selection
    if (!userRole) {
      navigate('/select-role');
      return;
    }

    // Subscribe to todo changes
    const subscription = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
    
    return () => subscription.unsubscribe();
  }, [userRole, navigate]);

  function createTodo() {
    client.models.Todo.create({ content: window.prompt("Todo content") });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  function handleSwitchRole() {
    navigate('/select-role');
  }

  return (
    <main>
      <div className="header">
        <h1>{user?.signInDetails?.loginId}'s todos</h1>
        <div className="user-controls">
          <span className="role-badge">
            {isDirector ? 'Director' : 'Compliance Professional'}
          </span>
          <button onClick={signOut} className="sign-out-btn">
            Sign out
          </button>
        </div>
      </div>
      
      {/* Director-specific controls */}
      {isDirector && (
        <div className="director-controls">
          <button onClick={createTodo} className="new-todo-btn">
            + Add New Todo (Director)
          </button>
        </div>
      )}
      
      {/* Professional-specific controls */}
      {isProfessional && (
        <div className="professional-controls">
          <button onClick={createTodo} className="new-todo-btn">
            + Add New Todo (Professional)
          </button>
        </div>
      )}
      
      {todos.length > 0 ? (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li 
              key={todo.id}
              className="todo-item"
            >
              <span>{todo.content}</span>
              
              {/* Only Directors can delete todos */}
              {isDirector && (
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  className="delete-btn"
                >
                  Delete
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">No todos yet. Create your first one!</p>
      )}
      
      <div className="info-box">
        <p>You are currently signed in as a <strong>{isDirector ? 'Director' : 'Compliance Professional'}</strong>.</p>
        <p>This determines what actions you can perform in the application.</p>
      </div>
    </main>
  );
}

export default App;
