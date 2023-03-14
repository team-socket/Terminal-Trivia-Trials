'use strict';

const inquirer = require('inquirer');
const { socket } = require('./socket');

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
  console.log(`${roomAndUser.userName} has joined ${roomAndUser.room}!
  ${roomAndUser.players} user(s) are in the room.`);

});

socket.on('PROMPT_START', () => {
  inquirer.prompt({
    type: 'confirm',
    name: 'startGame',
    message: 'Start Game with default values?',
  }).then(answer => {
    console.log(answer);
    if (answer.startGame) {
      socket.emit('GAME_START');
    } else{
      inquirer.prompt([{
        type: 'list',
        name: 'questionCategory',
        message: 'What category would you like to play?',
        choices: ['General Knowledge', 'Film', 'Music', 'Video Games', 'History', 'Science and Nature'],
      },
      {
        type: 'list',
        name: 'questionAmount',
        message: 'How many questions would you like?',
        choices: [5, 10, 15, 20],
      },
      ]).then(settings => {
        socket.emit('CUSTOMIZE_GAME', settings);
      });
    }
  });
});

socket.on('RE_PROMPT_START', () => {
  console.log('Start Game with default values? (Y/n)');
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
  playerScores.sort((a, b) => b.score - a.score);
  console.log(playerScores);
  socket.emit('RETRY');
  score = 0;
});


