'use strict';

const { DESCRIPTORS, NOUNS } = require('./data');
const inquirer = require('inquirer');
const { socket } = require('./socket');

let score = 0;
let questionAmount = 0;
let userName = '';
let currentRoom = '';

const generateName = () => {
  let name = '';
  name = `${DESCRIPTORS[Math.floor(Math.random() * DESCRIPTORS.length)]} ${NOUNS[Math.floor(Math.random() * NOUNS.length)]}`;
  return name;
};

// Where it all starts
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

const createUser = () => {
  const passphraseOptions = [];

  for (let i = 0; i < 5; i++) {
    passphraseOptions.push(generateName());
  }

  inquirer.prompt([
    {
      type: 'input',
      name: 'userName',
      message: 'Enter your username',
    },
    {
      type: 'list',
      name: 'passphrase',
      message: 'Select a passphrase',
      choices: passphraseOptions,
    },
  ]).then(answer => {
    userName = answer.userName;
    console.log(userName);
    socket.emit('CREATE_USER', { username: userName, passphrase: answer.passphrase });
  });
};

socket.on('RETURN_PASSPHRASE', (passphrase) => {
  const passphraseOptions = [passphrase];

  for (let i = 0; i < 5; i++) {
    passphraseOptions.push(generateName());
  }
  passphraseOptions.sort(() => 0.5 - Math.random());

  inquirer.prompt({
    type: 'list',
    name: 'passphrase',
    message: 'Select a passphrase',
    choices: passphraseOptions,
  }).then(answer => {
    socket.emit('LOGIN_USER', { username: userName, passphrase: answer.passphrase });
  });
});

const initialPrompt = () => {
  inquirer.prompt({
    type: 'list',
    name: 'login',
    message: 'Log in or Sign up?',
    choices: ['Log in', 'Sign up'],
  }).then(answer => {
    if (answer.login === 'Log in') {
      inquirer.prompt({
        type: 'input',
        name: 'username',
        message: 'Enter your username',
      }).then(answer => {
        userName = answer.username;
        socket.emit('GET_PASSPHRASE', userName);
      });
    } else {
      createUser();
    }
  });
};

const getStats = () => {
  socket.emit('GET_STATS', userName);
};

initialPrompt();

socket.on('USER_EXISTS', () => {
  console.log('Username is taken');
  initialPrompt();
});

socket.on('INVALID_LOGIN', () => {
  console.log('INVALID LOGIN, TRY AGAIN');
  initialPrompt();
});



socket.on('LOGIN_GRANTED', () => {
  console.log(`Welcome, ${userName}`);
  inquirer.prompt({
    type: 'list',
    name: 'userSelect',
    message: 'Play a game or view your stats.',
    choices: ['Play', 'View stats'],
  }).then(answer => {
    if (answer.userSelect === 'Play') {
      getRooms();
    } else {
      getStats();
    }
  });
});

socket.on('USER_STATS', (userStats) => {
  console.log('USERNAME: ', userStats.username);
  console.log('SCORE: ', userStats.score);
  console.log('GAMES PLAYED: ', userStats.gamesPlayed);
  console.log('TOTAL QUESTIONS: ', userStats.totalQuestions);
  console.log('ACCURACY: ', (userStats.totalQuestions > 0 ? (Math.floor((userStats.score / userStats.totalQuestions) * 100) + '%') : 'No Data'));
  inquirer.prompt({
    type: 'list',
    name: 'userSelect',
    message: 'Play a game or view your stats.',
    choices: ['Play', 'View stats'],
  }).then(answer => {
    if (answer.userSelect === 'Play') {
      getRooms();
    } else {
      getStats();
    }
  });
});


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
    } else {
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

socket.on('START_TRIVIA', (payload) => {
  questionAmount = payload.questionAmount;
  let receivedQuestions = payload.questions;
  inquirer.prompt(payload.questions).then(answers => {
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
      questionAmount: questionAmount,
      username: userName,
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


