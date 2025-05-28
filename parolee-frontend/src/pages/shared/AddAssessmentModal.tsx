import React from 'react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const AddAssessmentModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Add Assessment (Stub)</h2>
        <button onClick={onSuccess}>Simulate Success</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default AddAssessmentModal;