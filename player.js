'use strict';

const inquirer = require('inquirer');
const { socket } = require('./socket');
const ui = new inquirer.ui.BottomBar();

let score = 0;

let userName = '';
let currentRoom = '';

// Where it all starts
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
      currentRoom = answer.chooseRoom;
      socket.emit('JOIN_ROOM', {
        room: answer.chooseRoom,
        userName: userName,
      });
    });
  });
};

socket.on('ROOM_JOINED', (roomAndUser) => {
  ui.updateBottomBar(`${roomAndUser.userName} has joined ${roomAndUser.room}!`);

});

socket.on('PROMPT_START', () => {
  inquirer.prompt({
    type: 'confirm',
    name: 'startGame',
    message: 'Start Game?',
  }).then(answer => {
    console.log(answer);
    if (answer) {
      socket.emit('GAME_START');
    }
  });
});

socket.on('START_TRIVIA', (questions) => {
  let receivedQuestions = questions;
  inquirer.prompt(questions).then(answers => {
    // console.log(answers, receivedQuestions);

    for (let key in answers) {
      console.log(`For question ${key} you answered -`, answers[key]);
      console.log('Correct Answer -', receivedQuestions[key - 1].answer);
      if (answers[key] == receivedQuestions[key - 1].answer) {
        score++;
      }

    }
    console.log(`CONGRATS! You scored ${score}`);
    socket.emit('GAME_OVER', {
      score: score,
      userName: userName,
      currentRoom: currentRoom,
    });
  });
});


socket.on('LEADERBOARD', (playerScores) => {
  playerScores.sort((a, b) => a.score - b.score);
  console.log(playerScores);
});


