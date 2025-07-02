import React, { useState } from 'react';
import './ServiceModal.css';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface Action {
  id: string;
  name: string;
  description: string;
  serviceId: string;
}

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: {
    id: string;
    name: string;
    type: 'COMPANY' | 'LLP';
    identifier: string;
  };
  mode: 'view' | 'edit';
}

const ServiceModal: React.FC<ServiceModalProps> = ({ isOpen, onClose, entity, mode }) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  // Available services
  const services: Service[] = [
    {
      id: 'incorporation',
      name: 'Incorporation Service',
      description: 'Manage incorporation-related tasks and compliance',
      category: 'compliance'
    },
    {
      id: 'annual-filing',
      name: 'Annual Filing Service',
      description: 'Handle annual returns and statutory filings',
      category: 'compliance'
    },
    {
      id: 'board-meetings',
      name: 'Board Meeting Service',
      description: 'Manage board meetings and resolutions',
      category: 'governance'
    }
  ];

  // Actions available for incorporation service
  const incorporationActions: Action[] = [
    {
      id: 'view-certificate',
      name: 'View Incorporation Certificate',
      description: 'View the incorporation certificate and details',
      serviceId: 'incorporation'
    },
    {
      id: 'update-details',
      name: 'Update Company Details',
      description: 'Modify company registration information',
      serviceId: 'incorporation'
    },
    {
      id: 'change-registered-office',
      name: 'Change Registered Office',
      description: 'Update registered office address',
      serviceId: 'incorporation'
    },
    {
      id: 'modify-moa-aoa',
      name: 'Modify MOA/AOA',
      description: 'Amend Memorandum and Articles of Association',
      serviceId: 'incorporation'
    }
  ];

  const getActionsForService = (serviceId: string): Action[] => {
    switch (serviceId) {
      case 'incorporation':
        return incorporationActions;
      default:
        return [];
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedAction(null);
  };

  const handleActionSelect = (action: Action) => {
    setSelectedAction(action);
    // Here you would implement the actual action logic
    console.log(`Executing action: ${action.name} for ${entity.type} ${entity.identifier}`);
    alert(`Action "${action.name}" would be executed for ${entity.name}`);
  };

  const handleBackToServices = () => {
    setSelectedService(null);
    setSelectedAction(null);
  };

  if (!isOpen) return null;

  return (
    <div className="service-modal-overlay" onClick={onClose}>
      <div className="service-modal" onClick={(e) => e.stopPropagation()}>
        <div className="service-modal-header">
          <h2>
            {mode === 'view' ? 'View' : 'Edit'} {entity.type === 'COMPANY' ? 'Company' : 'LLP'}
          </h2>
          <div className="entity-info">
            <h3>{entity.name}</h3>
            <p>{entity.type === 'COMPANY' ? 'CIN' : 'LLPIN'}: {entity.identifier}</p>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="service-modal-content">
          {!selectedService ? (
            <div className="services-list">
              <h3>Select a Service</h3>
              <div className="services-grid">
                {services.map(service => (
                  <div 
                    key={service.id} 
                    className="service-card"
                    onClick={() => handleServiceSelect(service)}
                  >
                    <h4>{service.name}</h4>
                    <p>{service.description}</p>
                    <span className="service-category">{service.category}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="actions-list">
              <div className="breadcrumb">
                <button className="breadcrumb-link" onClick={handleBackToServices}>
                  Services
                </button>
                <span> / {selectedService.name}</span>
              </div>
              
              <h3>Available Actions</h3>
              <div className="actions-grid">
                {getActionsForService(selectedService.id).map(action => (
                  <div 
                    key={action.id} 
                    className="action-card"
                    onClick={() => handleActionSelect(action)}
                  >
                    <h4>{action.name}</h4>
                    <p>{action.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;