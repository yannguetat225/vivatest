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
    history: []
};

// Fonction pour sauvegarder l'historique
function saveHistory() {
    const savedConversations = messages.history.map(msg => {
        if (msg.role === "user") {
            return {
                userMessage: msg.parts[0].text,
                apiResponse: null
            };
        } else if (msg.role === "model") {
            return {
                userMessage: messages.history[messages.history.indexOf(msg) - 1].parts[0].text,
                apiResponse: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: msg.parts[0].text
                            }]
                        }
                    }]
                }
            };
        }
    }).filter(msg => msg !== undefined);

    localStorage.setItem("saved-api-chats", JSON.stringify(savedConversations));
}

// Fonction pour charger l'historique
function loadHistory() {
    const chatContainer = document.querySelector(".chat-window .chat");
    if (!chatContainer) return;

    // Effacer le contenu actuel
    chatContainer.innerHTML = '';

    // Charger l'historique depuis localStorage
    const savedConversations = JSON.parse(localStorage.getItem("saved-api-chats")) || [];
    
    // Convertir le format de l'historique
    messages.history = [];
    savedConversations.forEach(conversation => {
        // Ajouter le message utilisateur
        messages.history.push({
            role: "user",
            parts: [{ text: conversation.userMessage }]
        });

        // Afficher le message utilisateur
        chatContainer.insertAdjacentHTML("beforeend", `
            <div class="user">
                <p>${conversation.userMessage}</p>
            </div>
        `);
        
        // Ajouter et afficher la réponse du modèle si elle existe
        if (conversation.apiResponse?.candidates?.[0]?.content?.parts?.[0]?.text) {
            const modelResponse = conversation.apiResponse.candidates[0].content.parts[0].text;
            messages.history.push({
                role: "model",
                parts: [{ text: modelResponse }]
            });

            chatContainer.insertAdjacentHTML("beforeend", `
                <div class="model">
                    <p></p>
                </div>
            `);
            
            const lastMessage = chatContainer.querySelector(".model:last-child p");
            updateMessageDisplay(lastMessage, modelResponse);
        }
    });

    // Faire défiler vers le bas
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// Fonction pour effacer l'historique
function clearHistory(e) {
    if (e) e.preventDefault();
    localStorage.removeItem("saved-api-chats");
    messages.history = [];
    const chatContainer = document.querySelector(".chat-window .chat");
    if (chatContainer) {
        chatContainer.innerHTML = `
            <div class="model">
                <p>Hello, comment puis-je vous aider ?</p>
            </div>
        `;
    }
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
        document.body.classList.add("chat-open");
        
        // Ajouter le message d'accueil si le chat est vide
        const chatContainer = chatWindow.querySelector(".chat");
        if (chatContainer && chatContainer.children.length === 0) {
            chatContainer.innerHTML = `
                <div class="model">
                    <p>Hello, comment puis-je vous aider ?</p>
                </div>
            `;
        }
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
        document.body.classList.remove("chat-open");
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
        const chat = model.startChat({ history: messages.history });
        const result = await chat.sendMessageStream(userMessage);
        
        // Préparer la zone de réponse
        chatContainer.insertAdjacentHTML("beforeend", `
            <div class="model">
                <p></p>
            </div>
        `);
        
        // Afficher la réponse par morceaux
        let fullResponse = '';
        const lastMessage = chatContainer.querySelector(".model:last-child p");
        
        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            fullResponse += chunkText;
            updateMessageDisplay(lastMessage, fullResponse);
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        // Mettre à jour l'historique
        const userMessageObj = { role: "user", parts: [{ text: userMessage }] };
        const modelMessageObj = { role: "model", parts: [{ text: fullResponse }] };
        
        messages.history.push(userMessageObj, modelMessageObj);

        // Sauvegarder l'historique dans le format de script.js
        saveHistory();

    } catch (error) {
        console.error("Error sending message:", error);
        document.querySelector(".chat-window .chat").insertAdjacentHTML("beforeend", `
            <div class="error">
                <p>The message could not be sent. Please try again.</p>
            </div>
        `);
    } finally {
        // Supprimer le loader
        const loader = document.querySelector(".chat-window .chat .loader");
        if (loader) loader.remove();
    }
}

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

// Fonction pour ajouter des boutons de copie aux blocs de code
function addCopyButtonToCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre');
    codeBlocks.forEach((block) => {
        // Éviter d'ajouter des boutons en double
        if (block.querySelector('.code__copy-btn')) return;
        
        const codeElement = block.querySelector('code');
        if (!codeElement) return;
        
        let language = [...codeElement.classList]
            .find(cls => cls.startsWith('language-'))
            ?.replace('language-', '') || 'Text';

        const languageLabel = document.createElement('div');
        languageLabel.innerText = language.charAt(0).toUpperCase() + language.slice(1);
        languageLabel.classList.add('code__language-label');
        block.appendChild(languageLabel);

        const copyButton = document.createElement('button');
        copyButton.innerHTML = '<i class="bx bx-copy"></i>';
        copyButton.classList.add('code__copy-btn');
        block.appendChild(copyButton);

        copyButton.addEventListener('click', () => {
            navigator.clipboard.writeText(codeElement.innerText).then(() => {
                copyButton.innerHTML = '<i class="bx bx-check"></i>';
                setTimeout(() => copyButton.innerHTML = '<i class="bx bx-copy"></i>', 2000);
            }).catch(err => {
                console.error("Copy failed:", err);
                alert("Unable to copy text!");
            });
        });
    });
}

// Fonction pour formater le texte avec Markdown
function formatText(text) {
    if (!text) return '';
    try {
        // Nettoyer le texte avant de le formater
        const cleanText = text
            .replace(/\\n/g, '\n') // Remplacer les \n littéraux par des retours à la ligne
            .replace(/\\/g, '\\\\') // Échapper les backslashes restants
            .trim();
            
        return marked.parse(cleanText);
    } catch (error) {
        console.error('Error formatting text:', error);
        return text;
    }
}

// Fonction pour mettre à jour l'affichage du message
function updateMessageDisplay(element, text) {
    if (!element || !text) return;
    try {
        const formattedHtml = formatText(text);
        element.innerHTML = formattedHtml;
        
        // S'assurer que highlight.js traite tous les blocs de code
        element.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
        
        addCopyButtonToCodeBlocks();
    } catch (error) {
        console.error('Error updating message display:', error);
        element.textContent = text;
    }
}

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing chat...");
    
    // Charger l'historique au démarrage
    loadHistory();
    
    // Ajouter les event listeners
    const chatButton = document.querySelector(".chat-button");
    const closeButton = document.querySelector(".chat-window .chat-icon-button:last-child"); 
    const sendButton = document.querySelector(".chat-window .input-area button");
    const chatInput = document.querySelector(".chat-window input");
    const deleteButton = document.getElementById("deleteButton");

    if (chatButton) chatButton.addEventListener("click", openChat);
    if (closeButton) closeButton.addEventListener("click", closeChat);
    if (sendButton) sendButton.addEventListener("click", sendMessage);
    if (chatInput) {
        chatInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    if (deleteButton) deleteButton.addEventListener("click", clearHistory);
});
