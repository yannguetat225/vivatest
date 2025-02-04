import { GoogleGenerativeAI } from "@google/generative-ai";

const businessInfo = `

General Business Information:
Website: www.yourbusiness.com

Return Policy:
Customers can return products within 30 days of purchase with the original receipt.
Items must be unused and in their original packaging.
Refunds will be processed to the original payment method.

Support Email: support@yourbusiness.com

Madrid Location:
Address: Calle Mayor 123, 28013 Madrid, Spain
Phone: +34 91 123 4567
Email: madrid@yourbusiness.com
Opening Hours:
Monday to Friday: 10:00 AM to 8:00 PM
Saturday: 10:00 AM to 6:00 PM
Sunday: Closed

New York Location:
Address: 456 Broadway, New York, NY 10012, USA
Phone: +1 212-123-4567
Email: newyork@yourbusiness.com
Opening Hours:
Monday to Friday: 9:00 AM to 7:00 PM
Saturday: 10:00 AM to 5:00 PM
Sunday: Closed

FAQs:
General:
What is your return policy?

You can return items within 30 days with the original receipt and packaging. Refunds are processed to the original payment method.
Do you ship internationally?

Yes, we ship to most countries. Shipping rates and delivery times vary by location.
How can I track my order?

You will receive a tracking number via email once your order is shipped.
Can I cancel or modify my order?

Orders can be modified or canceled within 24 hours. Please contact support@yourbusiness.com.
Madrid Location:
What are your opening hours in Madrid?

Monday to Friday: 10:00 AM to 8:00 PM
Saturday: 10:00 AM to 6:00 PM
Sunday: Closed
Is parking available at the Madrid store?

Yes, we offer parking nearby. Contact us for details.
How can I contact the Madrid store?

You can call us at +34 91 123 4567 or email madrid@yourbusiness.com.
New York Location:
What are your opening hours in New York?

Monday to Friday: 9:00 AM to 7:00 PM
Saturday: 10:00 AM to 5:00 PM
Sunday: Closed
Do you host events at the New York location?

Yes, we host regular workshops and community events. Check our website for updates.
How can I contact the New York store?

You can call us at +1 212-123-4567 or email newyork@yourbusiness.com.

Tone Instructions:
Conciseness: Respond in short, informative sentences.
Formality: Use polite language with slight formality (e.g., "Please let us know," "We are happy to assist").
Clarity: Avoid technical jargon unless necessary.
Consistency: Ensure responses are aligned in tone and style across all queries.
Example: "Thank you for reaching out! Please let us know if you need further assistance."

`;

const API_KEY = "AIzaSyCQeAe3UeV--WsvoPK-8DbKBPgTuSAYiVg";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-pro",
    systemInstruction: businessInfo
});

let messages = {
    history: [],
};

// Fonction pour logger les z-index
function logZIndexes() {
    const elements = {
        header: '.header-global',
        chatButton: '.chat-button',
        chatWindow: '.chat-window'
    };

    Object.entries(elements).forEach(([name, selector]) => {
        const element = document.querySelector(selector);
        if (element) {
            console.log(`${name} z-index:`, getComputedStyle(element).zIndex);
        } else {
            console.log(`${name} not found`);
        }
    });
}

// Fonction pour ouvrir le chat
function openChat(e) {
    if (e) e.preventDefault();
    console.log("Opening chat...");
    
    const chatWindow = document.querySelector(".chat-window");
    if (chatWindow) {
        chatWindow.style.display = "flex";
        chatWindow.style.flexDirection = "column";
        chatWindow.style.zIndex = "10000";
        document.body.classList.add("main-beige", "chat-open");
        logZIndexes();
    } else {
        console.error("Chat window not found");
    }
}

// Fonction pour fermer le chat
function closeChat(e) {
    if (e) e.preventDefault();
    console.log("Closing chat...");
    
    const chatWindow = document.querySelector(".chat-window");
    if (chatWindow) {
        chatWindow.style.display = "none";
        document.body.classList.remove("main-beige", "chat-open");
    } else {
        console.error("Chat window not found");
    }
}

// Fonction pour envoyer un message
async function sendMessage() {
    const chatInput = document.querySelector(".chat-window input");
    const userMessage = chatInput?.value;
    
    if (!userMessage?.trim()) {
        console.log("Empty message, ignoring...");
        return;
    }

    try {
        // Effacer l'input
        chatInput.value = "";

        // Ajouter le message utilisateur
        const chatContainer = document.querySelector(".chat-window .chat");
        chatContainer.insertAdjacentHTML("beforeend", `
            <div class="user">
                <p>${userMessage}</p>
            </div>
            <div class="loader"></div>
        `);

        // Faire défiler vers le bas
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Envoyer le message
        const chat = model.startChat(messages);
        const result = await chat.sendMessageStream(userMessage);
        
        // Préparer la zone de réponse
        chatContainer.insertAdjacentHTML("beforeend", `
            <div class="model">
                <p></p>
            </div>
        `);
        
        // Afficher la réponse par morceaux
        let modelMessages = '';
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            modelMessages = document.querySelectorAll(".chat-window .chat div.model");
            const lastMessage = modelMessages[modelMessages.length - 1];
            if (lastMessage) {
                lastMessage.querySelector("p").insertAdjacentHTML("beforeend", chunkText);
                chatContainer.scrollTop = chatContainer.scrollHeight;
            }
        }

        // Mettre à jour l'historique
        messages.history.push(
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: modelMessages[modelMessages.length - 1].querySelector("p").innerHTML }] }
        );

    } catch (error) {
        console.error("Error sending message:", error);
        document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend", `
            <div class="error">
                <p>The message could not be sent. Please try again.</p>
            </div>
        `);
    } finally {
        // Nettoyer le loader
        const loader = document.querySelector(".chat-window .chat .loader");
        if (loader) loader.remove();
    }
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing chat...");
    logZIndexes();

    // Event listeners pour le chat
    const chatButton = document.querySelector(".chat-button");
    const closeButton = document.querySelector(".chat-window .close");
    const sendButton = document.querySelector(".chat-window .input-area button");
    const chatInput = document.querySelector(".chat-window input");

    if (chatButton) chatButton.addEventListener("click", openChat);
    if (closeButton) closeButton.addEventListener("click", closeChat);
    if (sendButton) sendButton.addEventListener("click", sendMessage);
    if (chatInput) {
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") sendMessage();
        });
    }
});
