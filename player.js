'use strict';

const inquirer = require('inquirer');
const { socket } = require('../socket');

// socket.on('START_TRIVIA', (questions) => {
//   inquirer.prompt(questions).then(answers => {
//     console.log(answers);
//   });
// });

let userName = '';

inquirer.prompt({
  type: 'input',
  name: 'userName',
  message: 'Enter your username',
}).then(answer => {
  userName = answer.userName;
  console.log(userName);
  getRooms();
});

const getRooms = () => {
  socket.emit('GET_OPEN_ROOMS');
  socket.on('RECEIVE_ROOM_NAMES', (roomDirectoryArray) => {
    inquirer.prompt({
      type: 'list',
      name: 'chooseRoom',
      message: 'Choose a room to join',
      choices: roomDirectoryArray,
    }).then(answer => {
      console.log(answer, userName);
      socket.emit('JOIN_ROOM', {
        room: answer.chooseRoom,
        userName: userName,
      });
    });
  });
};

socket.on('ROOM_JOINED', (roomAndUser) => {
  console.log(`${roomAndUser.userName} has joined ${roomAndUser.room}!`);
});


