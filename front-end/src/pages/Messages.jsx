import { useState } from "react";
import axios from "axios";
import { getAuth } from "firebase/auth";
import "./Messages.css";
function Messages() {
    return (
        <main className="messages-content">
            <h1 className="page-title">Messages</h1>
            <div className="messages-wrapper">
                <p>Here you can manage your messages.</p>
                {/* Future implementation for message management */}
            </div>
        </main>
    );
}    
export default Messages;