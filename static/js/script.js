
let mediaRecorder;
let audioChunks = [];

document.addEventListener('DOMContentLoaded', function() {
    var sendButton = document.getElementById('send-button');
    var chatInput = document.getElementById('chat-input');

    sendButton.addEventListener('click', sendMessage);

    const textInputContainer = document.getElementById('text-input-container');
    const voiceInputContainer = document.getElementById('voice-input-container');
    const toggleButton = document.getElementById('toggle-input-method');

    toggleButton.addEventListener('click', function() {
        if (textInputContainer.style.display === 'none') {
            textInputContainer.style.display = 'flex';
            voiceInputContainer.style.display = 'none';
            toggleButton.textContent = 'Switch to Voice Input';
        } else {
            textInputContainer.style.display = 'none';
            voiceInputContainer.style.display = 'flex';
            toggleButton.textContent = 'Switch to Text Input';
        }
    });

    chatInput.addEventListener('keypress', function(event) {
        // Check if the key pressed is the Enter key (key code 13)
        if (event.key === 'Enter') {
            event.preventDefault();  // Prevent the default action to stop from form submitting
            sendMessage();
        }
    });

    function sendMessage() {
        var userInput = chatInput.value;

        if (userInput.trim() !== '') {
            var chatBody = document.getElementById('chatbot-body');
            var newMessage = document.createElement('div');
            newMessage.classList = "message-margin";
            newMessage.innerHTML = '<b>You: </b> ' + userInput;
            chatBody.appendChild(newMessage);

            postMessageToServer(userInput);

            // Clear the input field after sending the message
            chatInput.value = '';

            // Scroll to the bottom of the chat body
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    
});

function postMessageToServer(message) {
    fetch('/send-message', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({message: message})
    })
    .then(response => response.json())
    .then(data => {
        displayResponse(data);  // Implement this function to display the response in your chat
    })
    .catch(error => console.error('Error:', error));
}

function displayResponse(data) {

    var chatBody = document.getElementById('chatbot-body');
    var responseMessage = document.createElement('div');
    responseMessage.innerHTML = '<b>Bot:</b> ' + data.reply;
    chatBody.appendChild(responseMessage);
    chatBody.scrollTop = chatBody.scrollHeight;
}


document.getElementById('record-button').addEventListener('click', () => {
    const recordButton = document.getElementById('record-button');

    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                audioChunks = [];
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };
                mediaRecorder.onstop = () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                    sendAudioToServer(audioBlob);
                    recordButton.textContent = 'Record';
                };
                mediaRecorder.start();
                recordButton.textContent = 'Stop';
            }).catch(error => {
                console.error('Error accessing media devices:', error);
            });
    } else {
        mediaRecorder.stop();
        recordButton.textContent = 'Record';
    }
});

function sendAudioToServer(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob);

    fetch('/process-audio', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        if (data.message.trim() !== '') {
            var chatBody = document.getElementById('chatbot-body');
            var newMessage = document.createElement('div');
            newMessage.innerHTML = '<b>You: </b> ' + data.message;
            chatBody.appendChild(newMessage);

            postMessageToServer(data.message);

            // Clear the input field after sending the message
            chatInput.value = '';

            // Scroll to the bottom of the chat body
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    })
    .catch(error => console.error('Error:', error));
}
