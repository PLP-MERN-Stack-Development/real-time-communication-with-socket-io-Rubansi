(() => {
  const socket = io();

  const usernameEl = document.getElementById('username');
  const joinBtn = document.getElementById('join');
  const leaveBtn = document.getElementById('leave');
  const connEl = document.getElementById('conn');
  const chatEl = document.getElementById('chat');
  const messageInput = document.getElementById('messageInput');
  const sendBtn = document.getElementById('send');
  const privateSendBtn = document.getElementById('privateSend');
  const privateTo = document.getElementById('privateTo');
  const typingEl = document.getElementById('typing');
  const userListEl = document.getElementById('userList');

  let currentUsername = '';
  let typingTimeout = null;

  function addMessage(msg, cls) {
    const div = document.createElement('div');
    div.className = 'message ' + (cls || '');
    div.textContent = msg;
    chatEl.appendChild(div);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  // Connection events
  socket.on('connect', () => {
    connEl.textContent = 'connected';
  });
  socket.on('disconnect', () => {
    connEl.textContent = 'disconnected';
  });

  // Messages
  socket.on('receive_message', (m) => {
    addMessage(`[${m.timestamp}] ${m.sender}: ${m.message}`);
  });

  socket.on('private_message', (m) => {
    addMessage(`[PRIVATE ${m.timestamp}] ${m.sender}: ${m.message}`, 'system');
  });

  // User list and join/leave
  socket.on('user_list', (users) => {
    userListEl.textContent = users.map(u => u.username).join(', ') || '(none)';
    // populate select
    privateTo.innerHTML = '<option value="">-- select user --</option>' + users.map(u => `<option value="${u.id}">${u.username}</option>`).join('');
  });

  socket.on('user_joined', (u) => {
    addMessage(`${u.username} joined the chat`, 'system');
  });

  socket.on('user_left', (u) => {
    addMessage(`${u.username} left the chat`, 'system');
  });

  // Typing
  socket.on('typing_users', (users) => {
    typingEl.textContent = users.length ? `${users.join(', ')} typing...` : '';
  });

  joinBtn.addEventListener('click', () => {
    const name = usernameEl.value.trim();
    if (!name) return alert('Enter a username');
    currentUsername = name;
    socket.connect();
    socket.emit('user_join', name);
  });

  leaveBtn.addEventListener('click', () => {
    socket.disconnect();
    currentUsername = '';
  });

  sendBtn.addEventListener('click', () => {
    const txt = messageInput.value.trim();
    if (!txt) return;
    socket.emit('send_message', { message: txt });
    messageInput.value = '';
  });

  privateSendBtn.addEventListener('click', () => {
    const to = privateTo.value;
    const txt = messageInput.value.trim();
    if (!to) return alert('Select a recipient');
    if (!txt) return;
    socket.emit('private_message', { to, message: txt });
    messageInput.value = '';
  });

  messageInput.addEventListener('input', () => {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('typing', false);
    }, 800);
  });

})();
