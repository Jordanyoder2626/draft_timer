import React from "react";
import './Modal.css';

const Modal = ({ setIsOpen }) => {
  return (
    <div>
        <h1>Hello Modal</h1>
        <div>
            <button className="button" onClick={() => setIsOpen(false)}>close</button>
        </div>
    </div>

  );
};

export default Modal;