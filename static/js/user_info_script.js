class Chatbox {
  constructor() {
    this.args = {
      openButton: document.querySelector('.chatbox__button'),
      chatBox: document.querySelector('.chatbox__support'),
      form: document.getElementById('user-info-form'),
    };
    this.state = false;
    this.messages = [];
  }

  display() {
    const { openButton, chatBox } = this.args;
  
    openButton.addEventListener('click', () => this.toggleState(chatBox));
    const textField = document.getElementById('input_message');
    textField.addEventListener('keydown', (event) => {
      if (event.keyCode === 13) {
        event.preventDefault();
        const sendButton = document.getElementById('Submit_Button');
        sendButton.click();
      }
    });
      // Show error message when user inputs numbers in name field
      const nameInput = document.querySelector('#name-input');
      const nameErrorMessage = document.querySelector('#name-error-message');
      nameInput.addEventListener('input', () => {
        const nameRegex = /^[A-Za-z\s]*$/; // regex to match only letters and spaces
        if (!nameRegex.test(nameInput.value)) {
          nameErrorMessage.style.display = 'block';
          nameErrorMessage.style.color = 'red';
          nameErrorMessage.style.backgroundColor = 'white';
          nameErrorMessage.textContent = 'Error: Please enter only letters and spaces';
        } else {
          nameErrorMessage.style.display = 'none';
        }
      });
      // Show error message when user inputs invalid email address
          const emailInput = document.querySelector('#email-input');
          const emailErrorMessage = document.querySelector('#email-error-message');
          emailInput.addEventListener('input', () => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // regex to match valid email addresses
          if (!emailRegex.test(emailInput.value)) {
          emailErrorMessage.style.display = 'block';
          emailErrorMessage.style.color = 'red';
          emailErrorMessage.style.backgroundColor = 'white';
          emailErrorMessage.textContent = 'Error: Please enter a valid email address';
          } else {
          emailErrorMessage.style.display = 'none';
        }
      });
    
    // Show error message when user inputs non-numeric characters in phone number field
    const phoneInput = document.querySelector('#phone-input');
    const phoneErrorMessage = document.querySelector('#phone-error-message');
    phoneInput.addEventListener('input', () => {
      const phoneRegex = /^[0-9]*$/; // regex to match only numbers
      if (!phoneRegex.test(phoneInput.value)) {
        phoneErrorMessage.style.display = 'block';
        phoneErrorMessage.style.color = 'red';
        phoneErrorMessage.style.backgroundColor = 'white';
        phoneErrorMessage.textContent = 'Error: Please enter only numbers';
      } else {
        phoneErrorMessage.style.display = 'none';
      }
    });
  }

  toggleState(chatbox) {
    this.state = !this.state;

    // show or hides the box
    if (this.state) {
      chatbox.classList.add('chatbox--active');
    } else {
      chatbox.classList.remove('chatbox--active');
    }
  }

  updateChatText() {
    const chatMessages = document.querySelector('.chatbox__messages');
    chatMessages.innerHTML = '';
    this.messages.forEach((message) => {
      const { name, message: text, timestamp } = message;
      const chatBoxMessage = document.createElement('div');
      chatBoxMessage.classList.add(`chatbox__${name === 'user' ? 'user' : 'Sam'}`);
      if (name === 'user') {
        chatBoxMessage.innerHTML = `
          <div class="user-message">
            <p>${text}</p>
            <span class="timestamp">${timestamp}</span>
          </div>
          <div class="bot-message"></div>
        `;
      } else {
        chatBoxMessage.innerHTML = `
          <div class="user-message"></div>
          <div class="bot-message">
            <p>${text}</p>
            <span class="timestamp">${timestamp}</span>
          </div>
        `;
      }
      chatMessages.appendChild(chatBoxMessage);
    });
  }

  addMessage(name, message) {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessage = { name, message, timestamp };
    this.messages.push(newMessage);
    this.updateChatText();
  }
}

const chatbox = new Chatbox();
chatbox.display();
var onSendButton = document.querySelector('#Submit_Button');
onSendButton.addEventListener('click', (event) => {
  var textField = document.getElementById('input_message');
  let text = textField.value;
  if (text === '') {
    return;
  }
  chatbox.addMessage('user', text);

  fetch('http://127.0.0.1:5000/predict', {
    method: 'POST',
    body: JSON.stringify({ message: text }),
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((r) => r.json())
    .then((r) => {
      chatbox.addMessage('Sam', r.answer);
      textField.value = '';
    })
    .catch((error) => {
      console.error('Error:', error);
      chatbox.updateChatText();
      textField.value = '';
    });
});
var startChatButton = document.getElementById('start_chat');
startChatButton.disabled = true;
var userInfoForm = document.querySelector('#user-info-form');
var nameInput = document.querySelector('#name-input');
var emailInput = document.querySelector('#email-input');
var phoneInput = document.querySelector('#phone-input');
var nameErrorMessage = document.querySelector('#name-error-message');
var emailErrorMessage = document.querySelector('#email-error-message');
var phoneErrorMessage = document.querySelector('#phone-error-message');

// Add a submit event listener to the form
var otpMessage = document.querySelector('#button-success-message');
    var sendOTPBtn=document.querySelector('#send_otp')
      // Sending otp to the user email
    sendOTPBtn.addEventListener('click', function(event)
        {
          event.preventDefault();
          var emailInput = document.querySelector('#email-input');
          var userEmail = emailInput.value;
          fetch('/send_otp_email', 
          {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email: userEmail })
          })
          .then(response => 
          {
              if (response.ok) 
              {
                  // show message that OTP is sent
                  otpMessage.textContent = 'An OTP sent to your email address.';
              } 
              else 
              {
                  // show error message
                  alert("Error sending OTP. Please enter valid email.");
              }
          })
          .catch(error => 
          {
              console.error('Error:', error);
          });
        });

        var verifyBtn = document.querySelector('#verify_otp');

        // add event listener to the verify button
        var errorMessage = document.querySelector('#error-message');
        verifyBtn.addEventListener('click', function(event) 
          {
            event.preventDefault(); 
            var otpInput = document.querySelector('#otp-input');
            var userOtp = otpInput.value;
            // send the otp value to the server for verification
            fetch('/verify_otp', 
                {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ otp: userOtp })
                })
            .then(response => response.json())
            .then(data => 
              {
              if (data.status === 'success') 
                  {
                    otpMessage.style.display = 'none';
                    errorMessage.style.display='none';
                    var successMessage = document.querySelector('#success-message');
                    successMessage.textContent = data.message;
                    var startChatButton = document.getElementById('start_chat');
                    startChatButton.disabled = false;
                  } 
              else 
                  {
                    otpMessage.style.display = 'none';
                    errorMessage.textContent = data.message;
                  }
              })
            .catch(error => {
              console.error('Error:', error);
            });
          });
userInfoForm.addEventListener('submit', function(event) 
  {
    // Prevent the form from submitting
    event.preventDefault();
    //name input validation
    if (nameInput.value === '')
        {
          nameErrorMessage.innerHTML = 'Please enter your name.';
          return;
        }
    else if (!isValidName(nameInput.value)) 
        {
          nameErrorMessage.innerHTML = 'Please enter a valid name.';
          return;
        }
    else
        {
          nameErrorMessage.innerHTML = '';
        }
    // Email input validation
    if (emailInput.value === '') 
        {
          emailErrorMessage.innerHTML = 'Please enter your email address.';
          return;
        }
    else if (!isValidEmail(emailInput.value)) 
        {
          emailErrorMessage.innerHTML = 'Please enter a valid email address.';
          return;
        } 
    else 
        {
          emailErrorMessage.innerHTML = '';
        }
    // Validate the phone input
    if (phoneInput.value === '') 
        {
          phoneErrorMessage.innerHTML = 'Please enter your phone number.';
          return;
        }
    else if (!isValidPhone(phoneInput.value)) 
        {
          phoneErrorMessage.innerHTML = 'Please enter a valid phone number.';
          return;
        } 
    else 
        {
          phoneErrorMessage.innerHTML = '';
        }
    
    // If all inputs are valid, send an AJAX request to store the user details
    if(event.submitter.id==='start_chat')
        {
          const name = nameInput.value;
          const greetingElement = document.getElementById('chatbot-greeting');
          
          greetingElement.innerHTML = `<span>Hi, ${name}! How can I assist you today?</span>`;
          document.getElementById("user-info-form").style.display="none";
          
          document.getElementById("chatbot-greeting").style.display = "block";
          document.getElementById("chatbox-messages").style.display = "block";
          document.getElementById("chatbox-footer").style.display = "block";
            var xhr = new XMLHttpRequest();
            xhr.open('POST', '/user_info', true);
            xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
            xhr.onreadystatechange = function() 
            {
                if (xhr.readyState === XMLHttpRequest.DONE) 
                    {
                        if (xhr.status === 200) 
                        {
                          
                        }
                        else {
                          // If the request failed, display an error message
                          alert('Error: ' + xhr.responseText);
                        }
                    }
            }; 
            var userData = 
                {
                    'name': nameInput.value,
                    'email': emailInput.value,
                    'phone': phoneInput.value
                }; 
            xhr.send(JSON.stringify(userData));
        }
    });

// Function to validate email address
function isValidEmail(email) 
    {
        var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

// Function to validate phone number
function isValidPhone(phone) 
    {
        var phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
    }
// Function to validate name
function isValidName(name) 
    {
        var nameRegex = /^[A-Za-z\s]+$/;
        return nameRegex.test(name);
    }

